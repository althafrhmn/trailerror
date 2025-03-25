const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Message = require('../models/Message');
const userController = require('../controllers/userController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all users (admin only)
router.get('/', authorize('admin'), userController.getUsers);

// Get faculty members (accessible by students for leave applications)
router.get('/faculty', async (req, res) => {
  try {
    const facultyMembers = await User.find({ role: 'faculty' })
      .select('_id name email department'); // Only return necessary fields
      
    res.json({
      success: true,
      data: facultyMembers
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: 'Failed to fetch faculty members'
    });
  }
});

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    // Verify access rights
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user (admin only)
router.post('/', authorize('admin'), userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router; 