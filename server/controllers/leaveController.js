const User = require('../models/User');
const mongoose = require('mongoose');

// Get the Leave model from the provided schema or create a simplified version
let Leave;
try {
  Leave = mongoose.model('Leave');
} catch (e) {
  // If model doesn't exist, create it based on the schema in your database
  const leaveSchema = new mongoose.Schema({
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    parentApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      date: Date
    },
    facultyApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      date: Date,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      remarks: String
    },
    type: {
      type: String,
      enum: ['medical', 'personal', 'other'],
      default: 'personal'
    },
    attachments: [String],
    notificationsSent: {
      parent: {
        type: Boolean,
        default: false
      },
      faculty: {
        type: Boolean,
        default: false
      },
      student: {
        type: Boolean,
        default: false
      }
    }
  }, { timestamps: true });

  Leave = mongoose.model('Leave', leaveSchema);
}

// Get active leaves for a specific date
const getActiveLeaves = async (req, res) => {
  try {
    const { date, className } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }
    
    const queryDate = new Date(date);
    
    // Find all students in the provided class (if specified)
    let studentQuery = { role: 'student' };
    
    if (className) {
      studentQuery['studentInfo.class'] = className;
    }
    
    const students = className 
      ? await User.find(studentQuery).select('_id')
      : [];
    
    const studentIds = students.map(s => s._id);
    
    // Find all active leaves that include the selected date
    const leaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: queryDate },
      endDate: { $gte: queryDate },
      ...(className ? { student: { $in: studentIds } } : {})
    }).populate('student', 'name studentInfo.rollNo studentInfo.class');
    
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching active leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all leaves (for admin)
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('student', 'name studentInfo.rollNo studentInfo.class')
      .populate('facultyApproval.faculty', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get leaves for a specific student
const getStudentLeaves = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Verify access rights
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'faculty' &&
      req.user._id.toString() !== studentId &&
      !(req.user.parentInfo?.studentIds || []).some(id => id.toString() === studentId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these leave records'
      });
    }
    
    const leaves = await Leave.find({ student: studentId })
      .populate('facultyApproval.faculty', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching student leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new leave request
const createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason, type } = req.body;
    
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Start date, end date, and reason are required'
      });
    }
    
    // Create the leave request
    const leave = new Leave({
      student: req.user._id,
      startDate,
      endDate,
      reason,
      type: type || 'personal',
      status: 'pending',
      parentApproval: {
        status: 'pending'
      },
      facultyApproval: {
        status: 'pending'
      }
    });
    
    await leave.save();
    
    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a leave request status
const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, remarks } = req.body;
    
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (approved, rejected, or pending)'
      });
    }
    
    const leave = await Leave.findById(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'admin') {
      // Admin can update any leave status
      leave.status = status;
    } else if (req.user.role === 'faculty') {
      // Faculty can only update faculty approval
      leave.facultyApproval = {
        status,
        date: new Date(),
        faculty: req.user._id,
        remarks: remarks || leave.facultyApproval?.remarks
      };
      
      // If faculty approves and parent has approved, update overall status
      if (
        status === 'approved' && 
        leave.parentApproval?.status === 'approved'
      ) {
        leave.status = 'approved';
      } else if (status === 'rejected') {
        leave.status = 'rejected';
      }
    } else if (
      req.user.role === 'parent' && 
      (req.user.parentInfo?.studentIds || []).some(id => id.toString() === leave.student.toString())
    ) {
      // Parent can only update parent approval for their student
      leave.parentApproval = {
        status,
        date: new Date()
      };
      
      // If parent approves and faculty has approved, update overall status
      if (
        status === 'approved' && 
        leave.facultyApproval?.status === 'approved'
      ) {
        leave.status = 'approved';
      } else if (status === 'rejected') {
        leave.status = 'rejected';
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this leave request'
      });
    }
    
    await leave.save();
    
    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getActiveLeaves,
  getAllLeaves,
  getStudentLeaves,
  createLeaveRequest,
  updateLeaveStatus
}; 