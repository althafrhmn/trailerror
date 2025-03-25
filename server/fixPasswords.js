require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const atlasMongoURL = process.env.MONGODB_URI;

async function fixPasswords() {
  try {
    // Connect to Atlas MongoDB
    console.log('Connecting to Atlas MongoDB...');
    await mongoose.connect(atlasMongoURL);
    console.log('Connected to Atlas MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Fix passwords for each user
    for (const user of users) {
      // Set default password based on role
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

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(defaultPassword, salt);
      
      // Save the user
      await user.save();
      console.log(`Fixed password for user: ${user.username} (${user.role})`);
    }

    console.log('Successfully fixed all passwords');

    // Disconnect from Atlas MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from Atlas MongoDB');

  } catch (error) {
    console.error('Error during password fix:', error);
  } finally {
    process.exit();
  }
}

fixPasswords(); 