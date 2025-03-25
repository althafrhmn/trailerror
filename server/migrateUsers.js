require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const localMongoURL = 'mongodb://localhost:27017/attendance_db';
const atlasMongoURL = process.env.MONGODB_URI;

async function migrateUsers() {
  try {
    // Connect to local MongoDB
    console.log('Connecting to local MongoDB...');
    await mongoose.connect(localMongoURL);
    console.log('Connected to local MongoDB');

    // Get all users from local database
    const users = await User.find({}).select('+password');
    console.log(`Found ${users.length} users in local database`);

    // Disconnect from local MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from local MongoDB');

    // Connect to Atlas MongoDB
    console.log('Connecting to Atlas MongoDB...');
    await mongoose.connect(atlasMongoURL);
    console.log('Connected to Atlas MongoDB');

    // Clear existing users in Atlas
    await User.deleteMany({});
    console.log('Cleared existing users in Atlas');

    // Insert users into Atlas
    for (const user of users) {
      // Create a new user document with the same data
      const newUser = new User({
        username: user.username,
        password: user.password, // This will be the hashed password
        role: user.role,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        studentInfo: user.studentInfo,
        facultyInfo: user.facultyInfo,
        parentInfo: user.parentInfo
      });

      // Save the user (this will trigger the pre-save hook for password hashing)
      await newUser.save();
    }

    console.log('Successfully migrated users to Atlas MongoDB');

    // Disconnect from Atlas MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from Atlas MongoDB');

  } catch (error) {
    console.error('Error during user migration:', error);
  } finally {
    process.exit();
  }
}

migrateUsers(); 