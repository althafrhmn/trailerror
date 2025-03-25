require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateFacultyPermissions = async () => {
  try {
    // Update faculty1 permissions
    const faculty1 = await User.findOne({ username: 'faculty1' });
    if (faculty1) {
      faculty1.facultyInfo = {
        department: 'Computer Science',
        subjects: ['Data Structures', 'Algorithms', 'Database Systems'],
        assignedClasses: ['CSE-A', 'CSE-B']
      };
      await faculty1.save();
      console.log('Updated faculty1 permissions');
    }

    // Update faculty2 permissions
    const faculty2 = await User.findOne({ username: 'faculty2' });
    if (faculty2) {
      faculty2.facultyInfo = {
        department: 'Computer Science',
        subjects: ['Computer Networks', 'Operating Systems', 'Web Development'],
        assignedClasses: ['CSE-C', 'ECE-A']
      };
      await faculty2.save();
      console.log('Updated faculty2 permissions');
    }

    console.log('Faculty permissions updated successfully');
  } catch (error) {
    console.error('Error updating faculty permissions:', error);
  }
};

// Run the update
const run = async () => {
  try {
    await connectDB();
    await updateFacultyPermissions();
    await mongoose.disconnect();
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

run(); 