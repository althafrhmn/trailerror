const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Timetable = require('../models/Timetable');

const router = express.Router();

// Validation middleware
const validateTimetable = [
  body('class').notEmpty().withMessage('Class is required'),
  body('semester').isNumeric().withMessage('Semester must be a number'),
  body('department').notEmpty().withMessage('Department is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('schedule').isObject().withMessage('Schedule must be an object'),
];

// Get timetable by class and semester
router.get('/:class/:semester', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      class: req.params.class,
      semester: req.params.semester,
    }).populate('schedule.*.faculty', 'name');

    // If no timetable exists, return an empty structure
    if (!timetable) {
      return res.json({
        success: true,
        data: {
          class: req.params.class,
          semester: req.params.semester,
          department: req.params.class,
          schedule: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: []
          }
        }
      });
    }

    // Ensure schedule has all required days
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: []
    };

    // Merge existing schedule data
    if (timetable.schedule) {
      Object.keys(schedule).forEach(day => {
        schedule[day] = Array.isArray(timetable.schedule[day]) 
          ? timetable.schedule[day] 
          : [];
      });
    }

    res.json({
      success: true,
      data: {
        ...timetable.toObject(),
        schedule
      }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Create or update timetable (admin and faculty only)
router.post('/', [auth, authorize(['admin', 'faculty']), validateTimetable], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { class: className, semester, department, academicYear, schedule } = req.body;

    // Find existing timetable
    let timetable = await Timetable.findOne({ 
      class: className, 
      semester: semester
    });

    if (timetable) {
      // Update existing timetable
      timetable.department = department;
      timetable.academicYear = academicYear;

      // Merge the new schedule with existing schedule
      if (schedule) {
        Object.keys(schedule).forEach(day => {
          if (Array.isArray(schedule[day])) {
            // Ensure each period has required fields
            const validPeriods = schedule[day].filter(period => 
              period.subject && period.faculty && period.startTime && 
              period.endTime && period.room
            );
            timetable.schedule[day] = validPeriods;
          }
        });
      }

      timetable.lastUpdatedBy = req.user._id;
    } else {
      // Create new timetable
      // Initialize empty schedule structure
      const emptySchedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
      };

      // Merge provided schedule with empty schedule
      if (schedule) {
        Object.keys(schedule).forEach(day => {
          if (Array.isArray(schedule[day])) {
            // Ensure each period has required fields
            const validPeriods = schedule[day].filter(period => 
              period.subject && period.faculty && period.startTime && 
              period.endTime && period.room
            );
            emptySchedule[day] = validPeriods;
          }
        });
      }

      timetable = new Timetable({
        class: className,
        semester: parseInt(semester),
        department,
        academicYear,
        schedule: emptySchedule,
        lastUpdatedBy: req.user._id
      });
    }

    await timetable.save();
    
    res.json({
      success: true,
      data: timetable,
      message: 'Timetable saved successfully'
    });
  } catch (error) {
    console.error('Create/Update timetable error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error' 
    });
  }
});

// Update specific day's schedule
router.put('/:class/:semester', [auth, authorize(['admin', 'faculty'])], async (req, res) => {
  try {
    const { class: className, semester } = req.params;
    const { schedule } = req.body;

    const timetable = await Timetable.findOne({
      class: className,
      semester: parseInt(semester)
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Update the schedule
    if (schedule) {
      Object.keys(schedule).forEach(day => {
        if (Array.isArray(schedule[day])) {
          // Ensure each period has required fields
          const validPeriods = schedule[day].filter(period => 
            period.subject && period.faculty && period.startTime && 
            period.endTime && period.room
          );
          timetable.schedule[day] = validPeriods;
        }
      });
    }

    timetable.lastUpdatedBy = req.user._id;
    await timetable.save();

    res.json({
      success: true,
      data: timetable,
      message: 'Timetable updated successfully'
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Delete timetable (admin only)
router.delete('/:class/:semester', auth, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndDelete({
      class: req.params.class,
      semester: req.params.semester,
    });

    if (!timetable) {
      return res.status(404).json({ 
        success: false,
        message: 'Timetable not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Timetable deleted successfully' 
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router; 