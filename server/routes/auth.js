const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

// Login validation
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'faculty', 'student', 'parent'])
    .withMessage('Invalid role'),
];

// Create user validation
const createUserValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'faculty', 'student', 'parent'])
    .withMessage('Invalid role'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
];

// Routes
router.post('/login', loginValidation, authController.login);
router.get('/me', auth, authController.getCurrentUser);
router.post(
  '/users',
  auth,
  authorize('admin'),
  createUserValidation,
  authController.createUser
);
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format'),
  ],
  authController.updateProfile
);

module.exports = router; 