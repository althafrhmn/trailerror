const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Message = require('../models/Message');
const { sendLeaveApplication } = require('../services/emailService');

const router = express.Router();

// Create a special route for email testing without authentication
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email || 'gym666m@gmail.com';
    
    console.log('Attempting to send test email to:', testEmail);
    console.log('Using email credentials:', {
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD ? '****' : 'not set'
    });
    
    const { sendLeaveApplication, transporter } = require('../services/emailService');
    
    // First test the transporter connection
    const verifyResult = await transporter.verify();
    console.log('Email transport verification:', verifyResult);
    
    // Send a test email
    const testResult = await sendLeaveApplication({
      subject: 'Test Email',
      toEmail: testEmail,
      fromDate: new Date(),
      toDate: new Date(Date.now() + 86400000), // tomorrow
      leaveType: 'Test',
      content: 'This is a test email to verify the email service is working correctly.',
      attachments: [],
      studentName: 'Test Student',
      studentId: 'TEST-ID-123'
    });
    
    res.status(200).json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      results: testResult
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Apply auth middleware to all routes below this point
router.use(auth);

/**
 * @route   POST /api/leaves
 * @desc    Submit a new leave application
 * @access  Private (Student)
 */
router.post('/', [
  body('faculty').notEmpty().withMessage('Faculty is required'),
  body('type').isIn(['Medical', 'Personal', 'Family', 'Exam', 'Event', 'Other']).withMessage('Valid leave type is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can submit leave applications'
      });
    }

    const { faculty, type, subject, description, startDate, endDate, sendEmail } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'End date cannot be before start date'
      });
    }

    // Verify faculty exists
    const facultyUser = await User.findById(faculty);
    if (!facultyUser || facultyUser.role !== 'faculty') {
      return res.status(404).json({
        success: false,
        error: 'Faculty member not found'
      });
    }

    // Create a message for the faculty
    const messageContent = `
LEAVE APPLICATION

Type: ${type}
Subject: ${subject}
Date: ${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to 
${new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${description}

Submitted by: ${req.user.name}
Student ID: ${req.user._id}
    `.trim();

    const message = new Message({
      sender: req.user._id,
      receiver: faculty,
      subject: `Leave Application: ${subject}`,
      content: messageContent,
      metadata: {
        type: 'leave-application',
        leaveType: type,
        startDate,
        endDate,
        approved: false
      }
    });

    await message.save();

    // Create leave record
    const leave = new Leave({
      student: req.user._id,
      faculty,
      type,
      subject,
      description,
      startDate,
      endDate,
      messageId: message._id
    });

    await leave.save();

    // Send email notification - always attempt to send regardless of sendEmail flag
    let emailResult = { sent: false };
    try {
      // Get faculty email and student information
      const facultyUser = await User.findById(faculty).select('email name');
      const student = await User.findById(req.user._id).select('name');
      
      if (!facultyUser || !facultyUser.email) {
        console.error('Faculty email not found for id:', faculty);
        throw new Error('Faculty email not found');
      }
      
      console.log('Sending leave notification to faculty:', facultyUser.email);
      
      // Send email with improved error handling
      emailResult = await sendLeaveApplication({
        subject,
        toEmail: facultyUser.email,
        fromDate: startDate,
        toDate: endDate,
        leaveType: type,
        content: description,
        attachments: req.files || [],
        studentName: student.name,
        studentId: student._id
      });
      
      if (emailResult.sent) {
        console.log('Email notification sent successfully to faculty:', facultyUser.email);
      } else {
        console.error('Email notification failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      emailResult = { 
        sent: false, 
        error: emailError.message 
      };
    }

    res.status(201).json({
      success: true,
      data: leave,
      email: emailResult
    });
  } catch (error) {
    console.error('Leave application error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/leaves
 * @desc    Get all leaves (filtered by role)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { status, start, end } = req.query;
    const filter = {};
    
    // Apply filters based on user role
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (req.user.role === 'faculty') {
      filter.faculty = req.user._id;
    }
    
    // Apply status filter if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    // Apply date range filter if provided
    if (start || end) {
      filter.startDate = {};
      if (start) filter.startDate.$gte = new Date(start);
      if (end) filter.endDate = { $lte: new Date(end) };
    }

    const leaves = await Leave.find(filter)
      .populate('student', 'name email')
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/leaves/:id
 * @desc    Get leave by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('student', 'name email')
      .populate('faculty', 'name email');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }
    
    // Check if user has permission to view this leave
    if (
      req.user.role === 'student' && leave.student._id.toString() !== req.user._id.toString() ||
      req.user.role === 'faculty' && leave.faculty._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this leave'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Get leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   PUT /api/leaves/:id
 * @desc    Update leave status (approve/reject)
 * @access  Private (Faculty)
 */
router.put('/:id', [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be either approved or rejected'),
  body('comments').optional()
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    // Check if user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        error: 'Only faculty can approve/reject leave applications'
      });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }
    
    // Check if this faculty is assigned to this leave
    if (leave.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this leave'
      });
    }

    const { status, comments } = req.body;

    // Update leave status
    leave.status = status;
    if (comments) leave.comments = comments;
    leave.updatedAt = Date.now();
    
    await leave.save();

    // Update the related message if exists
    if (leave.messageId) {
      await Message.findByIdAndUpdate(leave.messageId, {
        'metadata.approved': status === 'approved',
        'metadata.status': status,
        'metadata.comments': comments || ''
      });
    }

    // Create notification message to student
    const notificationMessage = new Message({
      sender: req.user._id,
      receiver: leave.student,
      subject: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}: ${leave.subject}`,
      content: `
Your leave application for ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status}.

${comments ? `Comments: ${comments}` : ''}

Faculty: ${req.user.name}
      `.trim(),
      metadata: {
        type: 'leave-response',
        leaveId: leave._id
      }
    });

    await notificationMessage.save();

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 