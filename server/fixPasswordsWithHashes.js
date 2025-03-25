require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const atlasMongoURL = process.env.MONGODB_URI;

// Pre-hashed passwords using bcrypt with salt rounds 10
const hashedPasswords = {
  admin: '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO9JOL8W',     // admin123
  faculty: '$2a$10$rnaqFjHmMhh/Xc5Z7cJMROMvFMnMHKWyWlQHw/DEPPkO4T5aBJKB2',  // faculty123
  student: '$2a$10$3mr909BDC7LSRjYhjbN5Pewy0Sktxf.CHl6fT4Z0t8kxZoKKF.Yj6',   // student123
  parent: '$2a$10$UPFwCLxIQF66L0Vu4MrCVOyJ27Y8LbV7LYVeRE.XuYQKm.656.ibu',    // parent123
};

async function fixPasswordsWithHashes() {
  try {
    // Connect to Atlas MongoDB
    console.log('Connecting to Atlas MongoDB...');
    await mongoose.connect(atlasMongoURL);
    console.log('Connected to Atlas MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Update users directly in the database
    for (const user of users) {
      // Get the appropriate hash based on role
      const passwordHash = hashedPasswords[user.role] || hashedPasswords.admin;
      
      // Update the user document directly
      await User.updateOne(
        { _id: user._id },
        { $set: { password: passwordHash } }
      );
      
      console.log(`Updated password for user: ${user.username} (${user.role})`);
    }

    console.log('Successfully updated all passwords with fixed hashes');

    // Disconnect from Atlas MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from Atlas MongoDB');

  } catch (error) {
    console.error('Error fixing passwords:', error);
  } finally {
    process.exit();
  }
}

fixPasswordsWithHashes(); 