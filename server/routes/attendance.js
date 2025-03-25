const express = require('express');
const { body, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation for marking attendance
const markAttendanceValidation = [
  body('date').notEmpty().withMessage('Date is required'),
  body('class').notEmpty().withMessage('Class is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('attendanceData')
    .isArray()
    .withMessage('Attendance data must be an array')
    .notEmpty()
    .withMessage('Attendance data is required'),
  body('attendanceData.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('attendanceData.*.status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Invalid status'),
];

// Validation for getting student attendance
const getStudentAttendanceValidation = [
  query('studentId').notEmpty().withMessage('Student ID is required'),
  query('startDate').notEmpty().withMessage('Start date is required'),
  query('endDate').notEmpty().withMessage('End date is required'),
];

// Validation for getting class attendance
const getClassAttendanceValidation = [
  query('class').notEmpty().withMessage('Class is required'),
  query('date').notEmpty().withMessage('Date is required'),
  query('subject').notEmpty().withMessage('Subject is required'),
];

// Validation for updating attendance
const updateAttendanceValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Invalid status'),
];

// Routes
router.post(
  '/',
  auth,
  authorize('faculty'),
  markAttendanceValidation,
  attendanceController.markAttendance
);

router.get(
  '/student',
  auth,
  getStudentAttendanceValidation,
  attendanceController.getStudentAttendance
);

router.get(
  '/class',
  auth,
  authorize('admin', 'faculty'),
  getClassAttendanceValidation,
  attendanceController.getClassAttendance
);

router.put(
  '/:attendanceId',
  auth,
  authorize('admin', 'faculty'),
  updateAttendanceValidation,
  attendanceController.updateAttendance
);

module.exports = router; 