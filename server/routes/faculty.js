const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const facultyController = require('../controllers/facultyController');

// Protected faculty routes
router.use(auth);
router.use(authorize('faculty', 'admin'));

// Dashboard data endpoints
router.get('/classes', facultyController.getAssignedClasses);
router.get('/classes/today', facultyController.getTodayClasses);
router.get('/classes/upcoming', facultyController.getUpcomingClasses);
router.get('/tasks/pending', facultyController.getPendingTasks);
router.get('/students', facultyController.getTotalStudents);
router.get('/activities', facultyController.getRecentActivities);

module.exports = router; 