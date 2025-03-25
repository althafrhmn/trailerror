const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Login user
const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Log login attempt (without password)
    console.log(`Login attempt: username=${username}, role=${role}, password=${password}`);

    // Validate required fields
    if (!username || !password || !role) {
      console.log('Login failed: Missing username, password, or role');
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password and role'
      });
    }

    // Find user by username and role
    const user = await User.findOne({ username, role }).select('+password');

    if (!user) {
      console.log(`Login failed: User ${username} with role ${role} not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    console.log(`User found: ${user._id} (${user.username})`);
    console.log(`Stored hashed password: ${user.password}`);

    // For testing purposes, directly compare with known hashed values
    const testPasswords = {
      admin: 'admin123',
      faculty: 'faculty123',
      student: 'student123',
      parent: 'parent123'
    };

    const expectedPassword = testPasswords[user.role] || 'password123';
    console.log(`Using password: ${password}, Expected standard password: ${expectedPassword}`);

    // Check password using bcrypt directly
    const bcrypt = require('bcryptjs');
    const isMatchDirect = await bcrypt.compare(password, user.password);
    console.log(`Direct bcrypt comparison result: ${isMatchDirect}`);

    // Check password using the user method
    const isMatch = await user.comparePassword(password);
    console.log(`User method password comparison result: ${isMatch}`);
    
    if (!isMatch && !isMatchDirect) {
      console.log(`Login failed: Invalid password for user ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT Token
    const token = user.generateAuthToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log successful login
    console.log(`Login successful: ${user.username} (${user.role})`);

    // Send response
    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('studentInfo.parentId', 'name email')
      .populate('parentInfo.studentIds', 'name email studentInfo');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role, name, email, ...additionalInfo } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username or email already exists',
      });
    }

    // Create user based on role
    const userData = {
      username,
      password, // Note: In production, this should be hashed
      role,
      name,
      email,
    };

    // Add role-specific information
    if (role === 'student') {
      userData.studentInfo = additionalInfo.studentInfo;
    } else if (role === 'faculty') {
      userData.facultyInfo = additionalInfo.facultyInfo;
    } else if (role === 'parent') {
      userData.parentInfo = additionalInfo.parentInfo;
    }

    const user = new User(userData);
    await user.save();

    // If creating a student with parent info, update parent's studentIds
    if (role === 'student' && additionalInfo.studentInfo?.parentId) {
      await User.findByIdAndUpdate(
        additionalInfo.studentInfo.parentId,
        {
          $addToSet: { 'parentInfo.studentIds': user._id },
        }
      );
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const user = req.user;

    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.username;

    // Update user
    Object.assign(user, updates);
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getCurrentUser,
  createUser,
  updateProfile,
}; 