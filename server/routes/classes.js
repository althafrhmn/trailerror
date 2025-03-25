const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Import controller
const classController = require('../controllers/classController');

// Route to get classes for faculty
router.get('/faculty', auth, authorize('faculty'), classController.getFacultyClasses);

// Route to get all classes (for admin)
router.get('/', auth, authorize('admin'), classController.getAllClasses);

// Route to get a specific class by ID
router.get('/:id', auth, classController.getClassById);

module.exports = router; 