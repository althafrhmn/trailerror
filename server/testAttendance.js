require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const { trackActivity } = require('./utils/activityTracker');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Test attendance submission
const testAttendanceSubmission = async () => {
  try {
    console.log('Starting attendance submission test...');
    
    // Find a faculty user
    const faculty = await User.findOne({ role: 'faculty' });
    if (!faculty) {
      console.error('No faculty user found');
      return;
    }
    console.log(`Found faculty: ${faculty.name} (${faculty._id})`);
    
    // Find students in a class
    const className = faculty.facultyInfo?.assignedClasses?.[0] || 'CSE-A';
    const students = await User.find({ 
      role: 'student',
      'studentInfo.class': className
    });
    
    if (students.length === 0) {
      console.log(`No students found in class ${className}, creating mock data...`);
      // Find any students
      const anyStudents = await User.find({ role: 'student' }).limit(3);
      if (anyStudents.length === 0) {
        console.error('No student users found');
        return;
      }
      students.push(...anyStudents);
    }
    
    console.log(`Found ${students.length} students`);
    
    // Get a subject
    const subject = faculty.facultyInfo?.subjects?.[0] || 'Data Structures';
    
    // Create attendance data
    const today = new Date().toISOString().split('T')[0];
    const attendanceData = students.map(student => ({
      studentId: student._id,
      status: Math.random() > 0.3 ? 'present' : 'absent',
      remarks: 'Test remarks'
    }));
    
    console.log('Attendance data prepared:', JSON.stringify(attendanceData, null, 2));
    
    // Step 1: Try to create attendance records
    console.log('\nStep 1: Creating attendance records...');
    const attendanceRecords = attendanceData.map(data => ({
      student: data.studentId,
      class: className,
      subject,
      date: new Date(today),
      status: data.status,
      markedBy: faculty._id,
      remarks: data.remarks
    }));
    
    try {
      await Attendance.insertMany(attendanceRecords);
      console.log('✅ Attendance records created successfully');
    } catch (error) {
      console.error('❌ Failed to create attendance records:', error.message);
      return;
    }
    
    // Step 2: Try to track activity
    console.log('\nStep 2: Tracking activity...');
    try {
      await trackActivity({
        userId: faculty._id,
        type: 'attendance',
        message: `Marked attendance for ${subject} in ${className}`,
        metadata: {
          className,
          subject,
          date: today,
          count: attendanceData.length
        }
      });
      console.log('✅ Activity tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track activity:', error.message);
      // Continue to identify all potential issues
    }
    
    console.log('\nTest completed. If both steps passed, there might be an issue with the request data format.');
    console.log('If Step 2 failed, check the Activity model and the trackActivity function.');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

// Run the test
const run = async () => {
  const connected = await connectDB();
  if (connected) {
    await testAttendanceSubmission();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run(); 