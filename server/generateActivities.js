require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Activity = require('./models/Activity');
const Timetable = require('./models/Timetable');

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

const generateFacultyActivities = async () => {
  try {
    // Get all faculty users
    const faculty = await User.find({ role: 'faculty' });
    
    if (faculty.length === 0) {
      console.log('No faculty users found, please create faculty users first');
      return;
    }
    
    console.log(`Found ${faculty.length} faculty users`);
    
    // Delete existing activities
    await Activity.deleteMany({});
    console.log('Cleared existing activities');
    
    // Sample activity messages for different types
    const activityMessages = {
      attendance: [
        'Marked attendance for {subject} in {class}',
        'Updated attendance records for {class}',
        'Completed attendance for {subject} class'
      ],
      assignment: [
        'Posted new assignment for {subject}',
        'Graded {subject} assignments',
        'Updated {subject} assignment deadline'
      ],
      message: [
        'Sent message to students in {class}',
        'Received message from admin',
        'Replied to parent inquiry about student performance'
      ],
      event: [
        'Created new event: Department Meeting',
        'Updated event details for {subject} exam',
        'RSVP to Faculty Development Program'
      ],
      login: [
        'Logged into the system',
        'Started new session',
        'Authenticated successfully'
      ],
      logout: [
        'Logged out of the system',
        'Ended session',
        'Signed out'
      ]
    };
    
    // Get timetable entries to use for context
    const timetableEntries = await Timetable.find({});
    
    // Activities to create
    const activities = [];
    
    // For each faculty
    for (const f of faculty) {
      // Generate 15-25 random activities over the past 2 weeks
      const activityCount = Math.floor(Math.random() * 11) + 15; // 15-25
      
      for (let i = 0; i < activityCount; i++) {
        // Random activity type
        const activityTypes = Object.keys(activityMessages);
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        // Random message for the type
        const messages = activityMessages[type];
        let message = messages[Math.floor(Math.random() * messages.length)];
        
        // Metadata for the activity
        const metadata = {};
        
        // Get a random class and subject if needed for the message
        if (message.includes('{class}') || message.includes('{subject}')) {
          // Get faculty's timetable entries
          const facultyEntries = timetableEntries.filter(e => 
            e.faculty.toString() === f._id.toString()
          );
          
          // If no entries, use fallback
          let entry;
          if (facultyEntries.length > 0) {
            entry = facultyEntries[Math.floor(Math.random() * facultyEntries.length)];
            metadata.class = entry.className;
            metadata.subject = entry.subject;
          } else {
            metadata.class = 'CSE-A';
            metadata.subject = 'Data Structures';
          }
          
          // Replace placeholders in message
          message = message.replace('{class}', metadata.class);
          message = message.replace('{subject}', metadata.subject);
        }
        
        // Random date within the last 2 weeks
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // 0-13 days ago
        
        // Random hours, minutes, seconds
        date.setHours(Math.floor(Math.random() * 12) + 8); // 8am - 8pm
        date.setMinutes(Math.floor(Math.random() * 60));
        date.setSeconds(Math.floor(Math.random() * 60));
        
        activities.push({
          user: f._id,
          faculty: f._id,
          type,
          message,
          metadata,
          createdAt: date
        });
      }
    }
    
    // Insert activities and sort by date
    activities.sort((a, b) => b.createdAt - a.createdAt);
    await Activity.insertMany(activities);
    
    console.log(`Created ${activities.length} faculty activities`);
  } catch (error) {
    console.error('Error generating activities:', error);
  }
};

const run = async () => {
  const connected = await connectDB();
  
  if (connected) {
    await generateFacultyActivities();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run(); 