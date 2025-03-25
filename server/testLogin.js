require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const atlasMongoURL = process.env.MONGODB_URI;

async function testLogin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(atlasMongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4,
      retryWrites: true,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('+password');
    console.log(`Found ${users.length} users`);

    // Test login for each user
    for (const user of users) {
      console.log(`Testing login for user: ${user.username} (${user.role})`);
      
      // Get the default password based on role
      let defaultPassword;
      switch (user.role) {
        case 'admin':
          defaultPassword = 'admin123';
          break;
        case 'faculty':
          defaultPassword = 'faculty123';
          break;
        case 'student':
          defaultPassword = 'student123';
          break;
        case 'parent':
          defaultPassword = 'parent123';
          break;
        default:
          defaultPassword = 'password123';
      }

      // Check if password is stored and in correct format
      console.log(`Password exists: ${!!user.password}`);
      console.log(`Password length: ${user.password ? user.password.length : 0}`);
      
      // Test password comparison
      const isMatch = await bcrypt.compare(defaultPassword, user.password);
      console.log(`Password match: ${isMatch}`);
      
      console.log('----------------------------');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    process.exit();
  }
}

testLogin(); 