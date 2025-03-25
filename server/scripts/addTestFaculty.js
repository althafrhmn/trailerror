const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb+srv://althafrahman960:DbxH0QzJPUMxvkjD@cluster0.w1lzr.mongodb.net/attendancedatabase_db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check if faculty exists
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    console.log('Current faculty count:', facultyCount);

    if (facultyCount === 0) {
      // Create test faculty
      const testFaculty = new User({
        name: 'Test Faculty',
        email: 'faculty@test.com',
        password: 'password123',
        role: 'faculty',
        department: 'Computer Science',
        username: 'testfaculty'
      });

      await testFaculty.save();
      console.log('Test faculty created:', testFaculty);
    } else {
      console.log('Faculty members already exist');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}).catch(error => {
  console.error('MongoDB connection error:', error);
}); 