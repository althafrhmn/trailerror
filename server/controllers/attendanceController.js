const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { trackActivity } = require('../utils/activityTracker');
const { sendAttendanceNotification } = require('../services/emailService');

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
      const notificationPromises = [];
      const emailResults = { 
        parent: { success: 0, failed: 0 },
        student: { success: 0, failed: 0 }
      };
      
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
        
        // Send notifications for absent and late students
        if (data.status === 'absent' || data.status === 'late') {
          // Get student details with parent info
          const student = await User.findById(data.studentId)
            .populate('studentInfo.parentId', 'name email');
          
          if (student) {
            const parentEmail = student.studentInfo?.parentId?.email;
            const parentName = student.studentInfo?.parentId?.name;
            const studentEmail = student.email;
            
            // Send email notification asynchronously
            const emailPromise = sendAttendanceNotification({
              studentName: student.name,
              studentId: student._id,
              studentEmail: studentEmail,
              parentEmail: parentEmail,
              parentName: parentName,
              attendanceStatus: data.status,
              date: date,
              className: className,
              subject: subject,
              remarks: data.remarks
            })
            .then((result) => {
              if (result.parent?.sent) {
                emailResults.parent.success++;
                console.log(`Email notification sent to parent of ${student.name}`);
              } else if (result.parent?.error) {
                emailResults.parent.failed++;
                console.error(`Failed to send email to parent of ${student.name}: ${result.parent.error}`);
              }
              
              if (result.student?.sent) {
                emailResults.student.success++;
                console.log(`Email notification sent to student ${student.name}`);
              } else if (result.student?.error) {
                emailResults.student.failed++;
                console.error(`Failed to send email to student ${student.name}: ${result.student.error}`);
              }
            })
            .catch(err => {
              emailResults.parent.failed++;
              emailResults.student.failed++;
              console.error(`Failed to send emails for ${student.name}:`, err);
            });
            
            notificationPromises.push(emailPromise);
          }
        }
      }

      // Wait for all notifications to be processed
      await Promise.allSettled(notificationPromises);

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

      // Build response message
      let responseMessage = 'Attendance updated successfully';
      const totalSent = emailResults.parent.success + emailResults.student.success;
      const totalFailed = emailResults.parent.failed + emailResults.student.failed;

      if (totalSent > 0) {
        responseMessage += `. ${totalSent} email notification${totalSent !== 1 ? 's' : ''} sent`;
        if (emailResults.parent.success > 0) {
          responseMessage += ` (${emailResults.parent.success} to parents`;
          if (emailResults.student.success > 0) {
            responseMessage += `, ${emailResults.student.success} to students`;
          }
          responseMessage += `)`;
        } else if (emailResults.student.success > 0) {
          responseMessage += ` (${emailResults.student.success} to students)`;
        }
      }

      if (totalFailed > 0) {
        responseMessage += ` (${totalFailed} email notification${totalFailed !== 1 ? 's' : ''} failed to send)`;
      }

      res.status(200).json({
        success: true,
        message: responseMessage,
        count: updates.length,
        emailNotifications: {
          sent: totalSent,
          failed: totalFailed,
          parentDetails: {
            success: emailResults.parent.success,
            failed: emailResults.parent.failed
          },
          studentDetails: {
            success: emailResults.student.success,
            failed: emailResults.student.failed
          }
        }
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

        const emailResults = { 
          parent: { success: 0, failed: 0 },
          student: { success: 0, failed: 0 }
        };

        if (absentAndLateStudents.length > 0) {
          const students = await User.find({
            _id: { $in: absentAndLateStudents.map(s => s.studentId) }
          }).populate('studentInfo.parentId', 'name email');

          // Send emails to parents using the new email service
          const notificationPromises = students.map(async (student) => {
            const attendance = absentAndLateStudents.find(
              a => a.studentId.toString() === student._id.toString()
            );

            if (student.studentInfo?.parentId?.email) {
              try {
                await sendAttendanceNotification({
                  studentName: student.name,
                  studentId: student._id,
                  studentEmail: student.email,
                  parentEmail: student.studentInfo.parentId.email,
                  parentName: student.studentInfo.parentId.name,
                  attendanceStatus: attendance.status,
                  date: date,
                  className: className,
                  subject: subject,
                  remarks: attendance.remarks
                });
                emailResults.parent.success++;
                emailResults.student.success++;
                return true;
              } catch (err) {
                console.error(`Failed to send email to parent of ${student.name}:`, err);
                emailResults.parent.failed++;
                emailResults.student.failed++;
                return false;
              }
            }
            return null;
          });

          await Promise.allSettled(notificationPromises);
        }

        // Build response message
        let responseMessage = 'Attendance marked successfully';
        const totalSent = emailResults.parent.success + emailResults.student.success;
        const totalFailed = emailResults.parent.failed + emailResults.student.failed;

        if (totalSent > 0) {
          responseMessage += `. ${totalSent} email notification${totalSent !== 1 ? 's' : ''} sent`;
          if (emailResults.parent.success > 0) {
            responseMessage += ` (${emailResults.parent.success} to parents`;
            if (emailResults.student.success > 0) {
              responseMessage += `, ${emailResults.student.success} to students`;
            }
            responseMessage += `)`;
          } else if (emailResults.student.success > 0) {
            responseMessage += ` (${emailResults.student.success} to students)`;
          }
        }

        if (totalFailed > 0) {
          responseMessage += ` (${totalFailed} email notification${totalFailed !== 1 ? 's' : ''} failed to send)`;
        }

        res.status(201).json({
          success: true,
          message: responseMessage,
          count: attendanceRecords.length,
          emailNotifications: {
            sent: totalSent,
            failed: totalFailed,
            parentDetails: {
              success: emailResults.parent.success,
              failed: emailResults.parent.failed
            },
            studentDetails: {
              success: emailResults.student.success,
              failed: emailResults.student.failed
            }
          }
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