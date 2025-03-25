const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { trackActivity } = require('../utils/activityTracker');

// Mark attendance for students
const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { date, class: className, subject, attendanceData, update = false } = req.body;
    const faculty = req.user._id;

    // For faculty, verify they have access to this class/subject
    if (req.user.role === 'faculty') {
      const hasAccess = req.user.facultyInfo?.subjects?.includes(subject) ||
                       req.user.facultyInfo?.assignedClasses?.includes(className);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to mark attendance for this class/subject'
        });
      }
    }

    // Check for existing attendance records for this date/class/subject
    const existingAttendance = await Attendance.find({
      class: className,
      subject,
      date: new Date(date)
    });

    // If records exist or update flag is true, use updateMany instead of insertMany
    if (existingAttendance.length > 0 || update) {
      console.log(`${update ? 'Update requested' : `Found ${existingAttendance.length} existing records`} for ${className}, ${subject} on ${date}. Updating...`);
      
      // Process each attendance record individually
      const updates = [];
      for (const data of attendanceData) {
        // Skip records without a status
        if (!data.status) continue;
        
        const updated = await Attendance.findOneAndUpdate(
          {
            student: data.studentId,
            class: className,
            subject,
            date: new Date(date)
          },
          {
            status: data.status,
            markedBy: faculty,
            lateArrivalTime: data.status === 'late' ? new Date() : undefined,
            remarks: data.remarks
          },
          { upsert: true, new: true }
        );
        updates.push(updated);
      }

      // Track activity
      await trackActivity({
        userId: faculty,
        type: 'attendance',
        message: `Updated attendance for ${subject} in ${className}`,
        metadata: {
          className,
          subject,
          date,
          count: updates.length
        }
      }).catch(err => console.error('Activity tracking error:', err));

      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        count: updates.length
      });
    } else {
      // Create attendance records
      const attendanceRecords = attendanceData
        .filter(data => data.status) // Only process records with a status
        .map(data => ({
          student: data.studentId,
          class: className,
          subject,
          date: new Date(date),
          status: data.status,
          markedBy: faculty,
          lateArrivalTime: data.status === 'late' ? new Date() : undefined,
          remarks: data.remarks
        }));

      if (attendanceRecords.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid attendance records provided'
        });
      }

      // Insert attendance records
      try {
        const result = await Attendance.insertMany(attendanceRecords, { ordered: false });

        // Track activity
        await trackActivity({
          userId: faculty,
          type: 'attendance',
          message: `Marked attendance for ${subject} in ${className}`,
          metadata: {
            className,
            subject,
            date,
            count: attendanceRecords.length
          }
        }).catch(err => console.error('Activity tracking error:', err));

        // Send notifications for absent and late students
        const absentAndLateStudents = attendanceData.filter(
          data => data.status === 'absent' || data.status === 'late'
        );

        if (absentAndLateStudents.length > 0) {
          const students = await User.find({
            _id: { $in: absentAndLateStudents.map(s => s.studentId) }
          }).populate('studentInfo.parentId');

          // Send emails to parents
          for (const student of students) {
            const attendance = absentAndLateStudents.find(
              a => a.studentId.toString() === student._id.toString()
            );

            if (student.studentInfo?.parentId?.email) {
              await sendEmail({
                to: student.studentInfo.parentId.email,
                subject: `Attendance Alert - ${student.name}`,
                text: `Your child ${student.name} was marked ${attendance.status} for ${subject} class on ${date}.`
              }).catch(err => console.error('Email sending error:', err));
            }
          }
        }

        res.status(201).json({
          success: true,
          message: 'Attendance marked successfully',
          count: attendanceRecords.length
        });
      } catch (error) {
        // Check if it's a duplicate key error
        if (error.code === 11000) {
          console.error('Duplicate key error:', error.message);
          return res.status(409).json({ 
            success: false,
            message: 'Attendance already marked for some students. Use the update feature instead.' 
          });
        }
        throw error; // Re-throw for the outer catch block
      }
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + (error.message || 'Unknown error')
    });
  }
};

// Get attendance for a student
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId, startDate, endDate, subject } = req.query;

    // Verify access rights
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'faculty' &&
      req.user._id.toString() !== studentId &&
      !req.user.parentInfo?.studentIds.includes(studentId)
    ) {
      return res.status(403).json({
        message: 'You do not have permission to view this attendance',
      });
    }

    const query = {
      student: studentId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (subject) {
      query.subject = subject;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate statistics
    const stats = await Attendance.calculateAttendance(
      studentId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      attendance,
      stats,
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get class attendance
const getClassAttendance = async (req, res) => {
  try {
    const { class: className, date, subject } = req.query;

    // For faculty, verify they have access to this class/subject
    if (req.user.role === 'faculty') {
      const hasAccess = req.user.facultyInfo?.subjects?.includes(subject) ||
                       req.user.facultyInfo?.assignedClasses?.includes(className);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view attendance for this class/subject'
        });
      }
    }

    const attendance = await Attendance.find({
      class: className,
      subject,
      date: new Date(date)
    })
      .populate('student', 'name studentInfo.rollNo')
      .populate('markedBy', 'name')
      .sort({ 'student.studentInfo.rollNo': 1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update attendance status
const updateAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Verify if faculty can update this attendance
    if (
      req.user.role === 'faculty' &&
      attendance.markedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You can only update attendance records that you marked',
      });
    }

    attendance.status = status;
    attendance.remarks = remarks;
    
    if (status === 'late') {
      attendance.lateArrivalTime = new Date();
    }

    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getClassAttendance,
  updateAttendance,
}; 