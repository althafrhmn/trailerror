const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Message = require('../models/Message');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('studentInfo.parentId', 'name email')
      .populate('parentInfo.studentIds', 'name email studentInfo');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify access rights
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== user._id.toString() &&
      !(req.user.role === 'faculty' && user.role === 'student')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    console.log('Server: Creating user with request body:', JSON.stringify(req.body, null, 2));

    const newUser = new User(req.body);
    
    // Ensure studentInfo is properly set if this is a student user
    if (req.body.role === 'student' && req.body.studentInfo) {
      console.log('Server: Processing student info:', JSON.stringify(req.body.studentInfo, null, 2));
      
      // Ensure proper type conversion for numeric fields
      if (req.body.studentInfo.semester) {
        newUser.studentInfo.semester = Number(req.body.studentInfo.semester);
      }
      
      // Ensure date fields are properly formatted
      if (req.body.studentInfo.dob) {
        newUser.studentInfo.dob = new Date(req.body.studentInfo.dob);
      }
      
      // Ensure parentId is properly set if provided
      if (req.body.studentInfo.parentId) {
        console.log('Server: Setting parent ID:', req.body.studentInfo.parentId);
        
        // Make sure the parentId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(req.body.studentInfo.parentId)) {
          newUser.studentInfo.parentId = req.body.studentInfo.parentId;
        } else {
          console.error('Server: Invalid parentId format:', req.body.studentInfo.parentId);
        }
      } else {
        console.log('Server: No parentId provided for student');
      }
    }
    
    await newUser.save();
    console.log('Server: User saved with ID:', newUser._id);
    console.log('Server: Saved student info:', JSON.stringify(newUser.studentInfo, null, 2));

    // If creating a student with parent info, update parent's studentIds
    if (req.body.role === 'student' && req.body.studentInfo?.parentId) {
      try {
        const parentUpdateResult = await User.findByIdAndUpdate(
          req.body.studentInfo.parentId,
          { 
            $addToSet: { 'parentInfo.studentIds': newUser._id } 
          },
          { new: true }
        );
        
        console.log('Server: Updated parent record:', parentUpdateResult ? 'Success' : 'Failed');
        if (parentUpdateResult) {
          console.log('Server: Parent now has students:', 
            JSON.stringify(parentUpdateResult.parentInfo?.studentIds || [], null, 2));
        }
      } catch (parentUpdateError) {
        console.error('Server: Error updating parent record:', parentUpdateError);
        // Continue anyway, don't fail the entire operation
      }
    }

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify access rights
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.username;

    // Check if email is being updated and is already in use
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    Object.assign(user, updates);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete related data based on user role
    switch (user.role) {
      case 'student':
        await Attendance.deleteMany({ student: user._id });
        await Leave.deleteMany({ student: user._id });
        if (user.studentInfo?.parentId) {
          await User.findByIdAndUpdate(
            user.studentInfo.parentId,
            { $pull: { 'parentInfo.studentIds': user._id } }
          );
        }
        break;

      case 'parent':
        await User.updateMany(
          { 'studentInfo.parentId': user._id },
          { $unset: { 'studentInfo.parentId': '' } }
        );
        break;

      case 'faculty':
        await Attendance.deleteMany({ markedBy: user._id });
        break;
    }

    // Delete all messages
    await Message.deleteMany({
      $or: [
        { sender: user._id },
        { receiver: user._id }
      ]
    });

    await User.findByIdAndDelete(user._id);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'User and related data deleted successfully',
      data: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}; 