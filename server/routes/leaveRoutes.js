const express = require('express');
const router = express.Router();
const multer = require('multer');
const LeaveApplication = require('../models/LeaveApplication');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/leave-attachments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.'));
    }
  }
});

// Get all faculty members
router.get('/faculty', auth, async (req, res) => {
  try {
    console.log('=== Faculty Route Debug ===');
    console.log('1. Request received for faculty list');
    console.log('2. User from auth middleware:', req.user);
    
    const facultyMembers = await User.find({ role: 'faculty' });
    console.log('3. Database query result:', facultyMembers);

    if (!facultyMembers || facultyMembers.length === 0) {
      console.log('4. No faculty members found in database');
      return res.status(404).json({ 
        success: false, 
        error: 'No faculty members found' 
      });
    }

    // Map faculty data to include only necessary fields
    const facultyData = facultyMembers.map(faculty => ({
      _id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      department: faculty.department
    }));

    console.log('5. Processed faculty data:', facultyData);
    return res.status(200).json({
      success: true,
      data: facultyData
    });
  } catch (error) {
    console.error('6. Error in /faculty route:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching faculty list'
    });
  }
});

// Submit leave application
router.post('/submit', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      subject,
      facultyId,
      fromDate,
      toDate,
      leaveType,
      content
    } = req.body;

    // Validate required fields
    if (!subject || !facultyId || !fromDate || !toDate || !leaveType || !content) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Create attachments array from uploaded files
    const attachments = req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    }));

    // Create new leave application
    const leaveApplication = new LeaveApplication({
      student: req.user._id,
      faculty: facultyId,
      subject,
      fromDate,
      toDate,
      leaveType,
      content,
      attachments,
      status: 'Pending'
    });

    // Save to database
    await leaveApplication.save();

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leaveApplication
    });

  } catch (error) {
    console.error('Error submitting leave application:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit leave application'
    });
  }
});

// Get leave applications for faculty
router.get('/faculty/applications', auth, async (req, res) => {
  try {
    // Check if user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Faculty only.'
      });
    }

    // Get all applications for this faculty
    const applications = await LeaveApplication.find({ faculty: req.user._id })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leave applications'
    });
  }
});

// Update leave application status (Approve/Reject)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // Check if user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Faculty only.'
      });
    }

    // Update application
    const application = await LeaveApplication.findOneAndUpdate(
      { _id: req.params.id, faculty: req.user._id },
      { status, comments },
      { new: true }
    ).populate('student', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Leave application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update leave application'
    });
  }
});

// Development routes
router.get('/dev/check-faculty', async (req, res) => {
  try {
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const facultyList = await User.find({ role: 'faculty' }).select('name email department');
    
    res.json({
      success: true,
      count: facultyCount,
      faculty: facultyList
    });
  } catch (error) {
    console.error('Error checking faculty:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/dev/add-test-faculty', async (req, res) => {
  try {
    // Create a test faculty member
    const testFaculty = new User({
      name: 'Test Faculty',
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty',
      department: 'Computer Science',
      username: 'testfaculty'
    });

    await testFaculty.save();
    
    res.json({
      success: true,
      message: 'Test faculty member created',
      faculty: {
        name: testFaculty.name,
        email: testFaculty.email,
        department: testFaculty.department
      }
    });
  } catch (error) {
    console.error('Error creating test faculty:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 