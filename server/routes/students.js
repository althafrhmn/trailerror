const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Import controller
const studentController = require('../controllers/studentController');

// Route to get students by class using class name as query parameter
router.get('/byClass', auth, authorize('faculty', 'admin'), studentController.getStudentsByClass);

// Route to get all students (for admin)
router.get('/', auth, authorize('admin'), studentController.getAllStudents);

// Route to get a specific student by ID
router.get('/:id', auth, studentController.getStudentById);

module.exports = router; 