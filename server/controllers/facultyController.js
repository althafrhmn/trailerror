const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Activity = require('../models/Activity');
const Leave = require('../models/Leave');
const mongoose = require('mongoose');

// Get all classes assigned to faculty
const getAssignedClasses = async (req, res) => {
  try {
    const { facultyId } = req.query;
    const facultyUser = await User.findById(facultyId || req.user._id);

    if (!facultyUser) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Get assigned classes from faculty info
    const assignedClasses = facultyUser.facultyInfo?.assignedClasses || [];

    return res.status(200).json({
      success: true,
      data: {
        count: assignedClasses.length,
        classes: assignedClasses
      }
    });
  } catch (error) {
    console.error('Error fetching assigned classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned classes'
    });
  }
};

// Get today's classes for faculty
const getTodayClasses = async (req, res) => {
  try {
    const { facultyId, date } = req.query;
    const faculty = facultyId || req.user._id;

    // Get today's date if not provided
    const today = date ? new Date(date) : new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];

    // Find timetable entries for today
    const timetableEntries = await Timetable.find({
      faculty: faculty,
      day: todayName
    });

    return res.status(200).json({
      success: true,
      data: {
        count: timetableEntries.length,
        classes: timetableEntries
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s classes'
    });
  }
};

// Get upcoming classes for faculty
const getUpcomingClasses = async (req, res) => {
  try {
    const { facultyId, date } = req.query;
    const faculty = facultyId || req.user._id;

    // Get today's date if not provided
    const today = date ? new Date(date) : new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];

    // Current time in 24-hour format (e.g., "14:30")
    const currentTime = today.getHours().toString().padStart(2, '0') + ':' + 
                        today.getMinutes().toString().padStart(2, '0');

    // Find timetable entries for today that haven't started yet
    const upcomingClasses = await Timetable.find({
      faculty: faculty,
      day: todayName,
      startTime: { $gte: currentTime }
    }).sort({ startTime: 1 });

    // Map the data to include needed information
    const formattedClasses = upcomingClasses.map(cls => ({
      _id: cls._id,
      subject: cls.subject,
      className: cls.className,
      startTime: cls.startTime,
      endTime: cls.endTime,
      roomNumber: cls.roomNumber
    }));

    return res.status(200).json({
      success: true,
      data: formattedClasses
    });
  } catch (error) {
    console.error('Error fetching upcoming classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming classes'
    });
  }
};

// Get pending tasks for faculty
const getPendingTasks = async (req, res) => {
  try {
    const { facultyId } = req.query;
    const faculty = facultyId || req.user._id;
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For this example, we'll consider today's unmarked attendance as pending tasks
    // Get assigned classes
    const facultyUser = await User.findById(faculty);
    const assignedClasses = facultyUser.facultyInfo?.assignedClasses || [];
    
    // Get timetable entries for today
    const dayOfWeek = today.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];
    
    const todayTimetable = await Timetable.find({
      faculty: faculty,
      day: todayName
    });
    
    // Check which classes have no attendance marked for today
    let pendingCount = 0;
    
    for (const entry of todayTimetable) {
      const attendanceExists = await Attendance.exists({
        class: entry.className,
        subject: entry.subject,
        date: {
          $gte: new Date(today),
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (!attendanceExists) {
        pendingCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        count: pendingCount,
        message: `You have ${pendingCount} class(es) with unmarked attendance today`
      }
    });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending tasks'
    });
  }
};

// Get total students under faculty
const getTotalStudents = async (req, res) => {
  try {
    const { facultyId } = req.query;
    const faculty = facultyId || req.user._id;
    
    // Get assigned classes
    const facultyUser = await User.findById(faculty);
    const assignedClasses = facultyUser.facultyInfo?.assignedClasses || [];
    
    if (assignedClasses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          count: 0,
          students: []
        }
      });
    }
    
    // Count students in assigned classes
    const studentCount = await User.countDocuments({
      role: 'student',
      'studentInfo.class': { $in: assignedClasses }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        count: studentCount
      }
    });
  } catch (error) {
    console.error('Error fetching total students:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch total students'
    });
  }
};

// Get recent activities for faculty
const getRecentActivities = async (req, res) => {
  try {
    const { facultyId, limit = 5 } = req.query;
    const faculty = facultyId || req.user._id;
    
    // Check if Activity model exists, if not return mock data
    if (!mongoose.models.Activity) {
      // Create mock activities if the Activity model doesn't exist
      const mockActivities = [
        { 
          type: 'attendance', 
          message: 'Marked attendance for CS101', 
          createdAt: new Date() 
        },
        { 
          type: 'message', 
          message: 'Received message from Admin', 
          createdAt: new Date(Date.now() - 3600000) 
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: mockActivities
      });
    }
    
    // Get real activities
    const activities = await Activity.find({ faculty: faculty })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    // If no activities found, check attendance records
    if (activities.length === 0) {
      const recentAttendance = await Attendance.find({ markedBy: faculty })
        .sort({ date: -1 })
        .limit(Number(limit));
      
      const attendanceActivities = recentAttendance.map(att => ({
        type: 'attendance',
        message: `Marked attendance for ${att.subject} in ${att.class}`,
        createdAt: att.date
      }));
      
      return res.status(200).json({
        success: true,
        data: attendanceActivities
      });
    }
    
    return res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
};

module.exports = {
  getAssignedClasses,
  getTodayClasses,
  getUpcomingClasses,
  getPendingTasks,
  getTotalStudents,
  getRecentActivities
}; 