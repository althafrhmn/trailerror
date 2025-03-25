require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const atlasMongoURL = process.env.MONGODB_URI;

async function resetPasswordsSimple() {
  try {
    // Connect to Atlas MongoDB
    console.log('Connecting to Atlas MongoDB...');
    await mongoose.connect(atlasMongoURL);
    console.log('Connected to Atlas MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Update users with unhashed passwords (they will be hashed by the pre-save hook)
    for (const user of users) {
      // Determine password based on role
      let password;
      switch (user.role) {
        case 'admin':
          password = 'admin123';
          break;
        case 'faculty':
          password = 'faculty123';
          break;
        case 'student':
          password = 'student123';
          break;
        case 'parent':
          password = 'parent123';
          break;
        default:
          password = 'password123';
      }

      // Update the user's password and save
      user.password = password;
      await user.save();

      console.log(`Reset password for user: ${user.username} (${user.role}) to '${password}'`);
    }

    console.log('Successfully reset all passwords');

    // Disconnect from Atlas MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from Atlas MongoDB');

  } catch (error) {
    console.error('Error during password reset:', error);
  } finally {
    process.exit();
  }
}

resetPasswordsSimple(); 