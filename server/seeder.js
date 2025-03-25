const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Event = require('./models/Event');
const Timetable = require('./models/Timetable');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Attendance.deleteMany();
    await Leave.deleteMany();
    await Event.deleteMany();
    await Timetable.deleteMany();

    // Create admin
    const admin = await User.create({
      username: 'admin',
      password: 'admin123', // Plain text password
      role: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
    });

    console.log('Admin created:', admin.username);

    // Create faculty
    const faculty = await User.create([
      {
        username: 'faculty1',
        password: 'faculty123', // Plain text password
        role: 'faculty',
        name: 'John Doe',
        email: 'john@example.com',
        facultyInfo: {
          department: 'Computer Science',
          subjects: ['Programming', 'Database'],
          phoneNumber: '1234567890',
          assignedClasses: ['CS-2023-A', 'CS-2023-B'],
        },
      },
      {
        username: 'faculty2',
        password: 'faculty123', // Plain text password
        role: 'faculty',
        name: 'Jane Smith',
        email: 'jane@example.com',
        facultyInfo: {
          department: 'Computer Science',
          subjects: ['Networking', 'Security'],
          phoneNumber: '0987654321',
          assignedClasses: ['CS-2023-A', 'CS-2023-C'],
        },
      },
    ]);

    console.log('Faculty created:', faculty.map(f => f.username));

    // Create parents
    const parents = await User.create([
      {
        username: 'parent1',
        password: 'parent123', // Plain text password
        role: 'parent',
        name: 'Parent One',
        email: 'parent1@example.com',
        parentInfo: {
          phoneNumber: '1122334455',
        },
      },
      {
        username: 'parent2',
        password: 'parent123', // Plain text password
        role: 'parent',
        name: 'Parent Two',
        email: 'parent2@example.com',
        parentInfo: {
          phoneNumber: '5544332211',
        },
      },
    ]);

    console.log('Parents created:', parents.map(p => p.username));

    // Create students
    const students = await User.create([
      {
        username: 'student1',
        password: 'student123', // Plain text password
        role: 'student',
        name: 'Student One',
        email: 'student1@example.com',
        studentInfo: {
          rollNo: 'CS2023001',
          admissionNo: 'ADM2023001',
          class: 'CS-2023-A',
          department: 'Computer Science',
          semester: 1,
          dob: new Date('2000-01-01'),
          phoneNumber: '9988776655',
          gender: 'Male',
          academicYear: '2023-24',
          parentId: parents[0]._id,
        },
      },
      {
        username: 'student2',
        password: 'student123', // Plain text password
        role: 'student',
        name: 'Student Two',
        email: 'student2@example.com',
        studentInfo: {
          rollNo: 'CS2023002',
          admissionNo: 'ADM2023002',
          class: 'CS-2023-A',
          department: 'Computer Science',
          semester: 1,
          dob: new Date('2000-02-02'),
          phoneNumber: '9988776644',
          gender: 'Female',
          academicYear: '2023-24',
          parentId: parents[1]._id,
        },
      },
    ]);

    console.log('Students created:', students.map(s => s.username));

    // Update parent with student IDs
    await User.findByIdAndUpdate(parents[0]._id, {
      'parentInfo.studentIds': [students[0]._id],
    });
    await User.findByIdAndUpdate(parents[1]._id, {
      'parentInfo.studentIds': [students[1]._id],
    });

    // Create attendance records
    const attendanceRecords = [];
    const subjects = ['Programming', 'Database', 'Networking', 'Security'];
    const startDate = new Date('2023-09-01');

    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (date.getDay() !== 0) { // Skip Sundays
        for (const student of students) {
          for (const subject of subjects) {
            attendanceRecords.push({
              student: student._id,
              subject,
              date,
              status: Math.random() > 0.1 ? 'present' : 'absent',
              markedBy: faculty[Math.floor(Math.random() * faculty.length)]._id,
            });
          }
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log('Attendance records inserted:', attendanceRecords.length);

    // Create leave records
    const leaveRecords = [];
    for (const student of students) {
      leaveRecords.push({
        student: student._id,
        reason: 'Medical leave',
        fromDate: new Date('2023-09-15'),
        toDate: new Date('2023-09-16'),
        status: 'approved',
        approvedBy: faculty[0]._id,
        parentApproval: true,
      },
      {
        student: student._id,
        reason: 'Family function',
        fromDate: new Date('2023-10-01'),
        toDate: new Date('2023-10-02'),
        status: 'rejected',
        approvedBy: faculty[0]._id,
        parentApproval: true,
        rejectionReason: 'Exam week',
      },
      {
        student: student._id,
        reason: 'Personal',
        fromDate: new Date('2023-10-15'),
        toDate: new Date('2023-10-15'),
        status: 'pending',
        parentApproval: false,
      });
    }

    await Leave.insertMany(leaveRecords);
    console.log('Leave records created:', leaveRecords.length);

    // Create events
    const events = await Event.create([
      {
        title: 'Mid Semester Exam',
        description: 'Programming and Database subjects',
        date: new Date('2023-10-20'),
        type: 'exam',
        class: 'CS-2023-A',
        department: 'Computer Science',
        createdBy: faculty[0]._id,
      },
      {
        title: 'Technical Symposium',
        description: 'Annual technical fest',
        date: new Date('2023-11-15'),
        type: 'event',
        department: 'Computer Science',
        createdBy: admin._id,
      },
      {
        title: 'Diwali Holiday',
        description: 'Festival holiday',
        date: new Date('2023-11-12'),
        type: 'holiday',
        createdBy: admin._id,
      },
    ]);

    console.log('Events created:', events.length);

    // Create timetable
    const timetable = await Timetable.create({
      class: 'CS-2023-A',
      department: 'Computer Science',
      semester: 1,
      academicYear: '2023-24',
      schedule: {
        monday: [
          {
            subject: 'Programming',
            faculty: faculty[0]._id,
            startTime: '09:00',
            endTime: '10:00',
          },
          {
            subject: 'Database',
            faculty: faculty[0]._id,
            startTime: '10:00',
            endTime: '11:00',
          },
        ],
        tuesday: [
          {
            subject: 'Networking',
            faculty: faculty[1]._id,
            startTime: '09:00',
            endTime: '10:00',
          },
          {
            subject: 'Security',
            faculty: faculty[1]._id,
            startTime: '10:00',
            endTime: '11:00',
          },
        ],
        // Add similar schedule for other days
      },
      lastUpdatedBy: admin._id,
    });

    console.log('Timetable created');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 