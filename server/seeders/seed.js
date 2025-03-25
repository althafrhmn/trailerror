require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Sample data
const sampleData = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
  },

  faculty: [
    {
      username: 'faculty1',
      password: 'faculty123',
      role: 'faculty',
      name: 'John Smith',
      email: 'john.smith@example.com',
      facultyInfo: {
        department: 'Computer Science',
        subjects: ['Programming', 'Database', 'Networking'],
        phoneNumber: '1234567890',
      },
    },
    {
      username: 'faculty2',
      password: 'faculty123',
      role: 'faculty',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      facultyInfo: {
        department: 'Mathematics',
        subjects: ['Calculus', 'Statistics', 'Linear Algebra'],
        phoneNumber: '0987654321',
      },
    },
  ],

  parents: [
    {
      username: 'parent1',
      password: 'parent123',
      role: 'parent',
      name: 'Robert Johnson',
      email: 'robert@example.com',
      parentInfo: {
        phoneNumber: '5555555555',
      },
    },
    {
      username: 'parent2',
      password: 'parent123',
      role: 'parent',
      name: 'Mary Williams',
      email: 'mary@example.com',
      parentInfo: {
        phoneNumber: '6666666666',
      },
    },
  ],

  students: [
    {
      username: 'student1',
      password: 'student123',
      role: 'student',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      studentInfo: {
        rollNo: '101',
        admissionNo: 'CS2023101',
        class: 'CSE-A',
        department: 'Computer Science',
        semester: 5,
        dob: new Date('2000-01-15'),
        phoneNumber: '1111111111',
      },
    },
    {
      username: 'student2',
      password: 'student123',
      role: 'student',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      studentInfo: {
        rollNo: '102',
        admissionNo: 'CS2023102',
        class: 'CSE-A',
        department: 'Computer Science',
        semester: 5,
        dob: new Date('2000-03-20'),
        phoneNumber: '2222222222',
      },
    },
  ],
};

// Function to seed data
const seedData = async () => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.error('Failed to connect to MongoDB');
      process.exit(1);
    }

    console.log('Starting to seed data...');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});

    // Create admin
    const admin = await User.create(sampleData.admin);
    console.log('Admin created:', admin.username);

    // Create faculty
    const faculty = await User.create(sampleData.faculty);
    console.log('Faculty created:', faculty.map(f => f.username));

    // Create parents
    const parents = await User.create(sampleData.parents);
    console.log('Parents created:', parents.map(p => p.username));

    // Create students and link with parents
    const students = await Promise.all(
      sampleData.students.map(async (student, index) => {
        student.studentInfo.parentId = parents[index]._id;
        const createdStudent = await User.create(student);
        
        await User.findByIdAndUpdate(parents[index]._id, {
          $push: { 'parentInfo.studentIds': createdStudent._id },
        });

        return createdStudent;
      })
    );
    console.log('Students created:', students.map(s => s.username));

    // Create attendance records
    console.log('Creating attendance records...');
    const attendanceRecords = [];
    const today = new Date();
    const subjects = ['Programming', 'Database', 'Networking', 'Calculus'];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      for (const student of students) {
        for (const subject of subjects) {
          const facultyMember = faculty.find(f => 
            f.facultyInfo.subjects.includes(subject)
          );

          if (facultyMember) {
            attendanceRecords.push({
              student: student._id,
              class: student.studentInfo.class,
              subject,
              date,
              status: Math.random() < 0.1 ? 'absent' : (Math.random() < 0.2 ? 'late' : 'present'),
              markedBy: facultyMember._id,
              lateArrivalTime: Math.random() < 0.2 ? date : undefined,
              remarks: '',
            });
          }
        }
      }
    }

    const batchSize = 100;
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      await Attendance.insertMany(batch);
      console.log(`Inserted attendance records ${i + 1} to ${Math.min(i + batchSize, attendanceRecords.length)}`);
    }
    console.log('All attendance records created:', attendanceRecords.length);

    // Create leave records
    console.log('Creating leave records...');
    const leaveTypes = ['sick', 'personal', 'other'];
    const leaveRecords = [];

    for (const student of students) {
      for (let i = 0; i < 3; i++) {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);

        leaveRecords.push({
          student: student._id,
          startDate,
          endDate,
          reason: `Sample leave reason ${i + 1}`,
          type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          status: Math.random() < 0.3 ? 'pending' : (Math.random() < 0.7 ? 'approved' : 'rejected'),
          parentApproval: {
            status: Math.random() < 0.8 ? 'approved' : 'pending',
            date: startDate,
          },
          facultyApproval: {
            status: Math.random() < 0.7 ? 'approved' : 'pending',
            date: startDate,
            faculty: faculty[0]._id,
            remarks: 'Sample faculty remarks',
          },
        });
      }
    }

    await Leave.create(leaveRecords);
    console.log('Leave records created:', leaveRecords.length);

    console.log('Database seeded successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Start seeding
seedData(); 