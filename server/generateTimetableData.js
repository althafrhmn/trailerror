require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
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

const generateTimetableData = async () => {
  try {
    // Get all faculty users
    const faculty = await User.find({ role: 'faculty' });
    
    if (faculty.length === 0) {
      console.log('No faculty users found, please create faculty users first');
      return;
    }
    
    console.log(`Found ${faculty.length} faculty users`);
    
    // Delete existing timetable entries
    await Timetable.deleteMany({});
    console.log('Cleared existing timetable data');
    
    // Sample class names and subjects
    const classes = ['CSE-A', 'CSE-B', 'CSE-C', 'ECE-A', 'ECE-B', 'MECH-A', 'MECH-B'];
    const subjects = [
      'Data Structures', 'Algorithms', 'Database Systems', 
      'Computer Networks', 'Operating Systems', 'Web Development',
      'Machine Learning', 'Artificial Intelligence', 'Calculus', 
      'Linear Algebra', 'Discrete Mathematics'
    ];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const rooms = ['101', '102', '103', '201', '202', '203', '301', '302', '303'];
    
    // Time slots
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:15', end: '12:15' },
      { start: '12:15', end: '13:15' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:15', end: '17:15' }
    ];
    
    const timetableEntries = [];
    
    // For each faculty
    for (const f of faculty) {
      // Get assigned classes and subjects from faculty info
      const assignedClasses = f.facultyInfo?.assignedClasses || [];
      const assignedSubjects = f.facultyInfo?.subjects || [];
      
      // If no assigned classes or subjects, assign some
      const classesToUse = assignedClasses.length > 0 ? 
        assignedClasses : 
        classes.slice(0, Math.floor(Math.random() * 3) + 1);
      
      const subjectsToUse = assignedSubjects.length > 0 ? 
        assignedSubjects : 
        subjects.slice(0, Math.floor(Math.random() * 3) + 1);
      
      // Create 10-15 entries per faculty
      const entriesCount = Math.floor(Math.random() * 6) + 10;
      
      for (let i = 0; i < entriesCount; i++) {
        const className = classesToUse[Math.floor(Math.random() * classesToUse.length)];
        const subject = subjectsToUse[Math.floor(Math.random() * subjectsToUse.length)];
        const day = days[Math.floor(Math.random() * days.length)];
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        // Check if this entry already exists to avoid duplicates
        const existing = timetableEntries.some(entry => 
          entry.faculty.toString() === f._id.toString() &&
          entry.day === day &&
          entry.startTime === timeSlot.start
        );
        
        if (!existing) {
          timetableEntries.push({
            faculty: f._id,
            className,
            subject,
            day,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            roomNumber: room,
            createdBy: f._id,
            isActive: true
          });
        }
      }
    }
    
    // Insert all entries at once
    await Timetable.insertMany(timetableEntries);
    
    console.log(`Generated ${timetableEntries.length} timetable entries`);
    
    // If there are no timetable entries for today, create some
    const today = new Date();
    const dayIndex = today.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayIndex];
    
    const todayEntries = await Timetable.find({ day: todayName });
    
    if (todayEntries.length === 0) {
      console.log(`No entries for today (${todayName}), creating some...`);
      
      const additionalEntries = [];
      
      // For each faculty, create 1-3 entries for today
      for (const f of faculty) {
        const entriesCount = Math.floor(Math.random() * 3) + 1;
        const assignedClasses = f.facultyInfo?.assignedClasses || classes.slice(0, 2);
        const assignedSubjects = f.facultyInfo?.subjects || subjects.slice(0, 2);
        
        for (let i = 0; i < entriesCount; i++) {
          const className = assignedClasses[Math.floor(Math.random() * assignedClasses.length)];
          const subject = assignedSubjects[Math.floor(Math.random() * assignedSubjects.length)];
          const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
          const room = rooms[Math.floor(Math.random() * rooms.length)];
          
          additionalEntries.push({
            faculty: f._id,
            className,
            subject,
            day: todayName,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            roomNumber: room,
            createdBy: f._id,
            isActive: true
          });
        }
      }
      
      await Timetable.insertMany(additionalEntries);
      console.log(`Added ${additionalEntries.length} entries for today (${todayName})`);
    }
    
    console.log('Timetable data generation completed successfully');
  } catch (error) {
    console.error('Error generating timetable data:', error);
  }
};

const run = async () => {
  const connected = await connectDB();
  
  if (connected) {
    await generateTimetableData();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run(); 