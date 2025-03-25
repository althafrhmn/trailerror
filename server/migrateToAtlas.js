const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Message = require('./models/Message');
const Event = require('./models/Event');
const Timetable = require('./models/Timetable');

// Load environment variables
dotenv.config();

// Local MongoDB URL
const LOCAL_DB_URL = 'mongodb://localhost:27017/attendance_db';

// Atlas MongoDB URL (from .env)
const ATLAS_DB_URL = process.env.MONGODB_URI;

console.log('Starting migration...');
console.log('Migrating from local MongoDB to Atlas...');
console.log('Atlas connection string:', ATLAS_DB_URL);

// Function to connect to MongoDB
const connectToMongoDB = async (uri) => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB at ${uri}`);
    return true;
  } catch (error) {
    console.error(`Failed to connect to MongoDB at ${uri}:`, error);
    return false;
  }
};

// Function to disconnect from MongoDB
const disconnectFromMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
    return false;
  }
};

// Function to export data from local MongoDB
const exportDataFromLocalDB = async () => {
  try {
    // Connect to local MongoDB
    if (!(await connectToMongoDB(LOCAL_DB_URL))) {
      throw new Error('Failed to connect to local MongoDB');
    }

    // Fetch all data from local MongoDB
    const users = await User.find({});
    const attendance = await Attendance.find({});
    const leaves = await Leave.find({});
    const messages = await Message.find({});
    const events = await Event.find({});
    const timetables = await Timetable.find({});

    console.log(`Exported ${users.length} users from local MongoDB`);
    console.log(`Exported ${attendance.length} attendance records from local MongoDB`);
    console.log(`Exported ${leaves.length} leave records from local MongoDB`);
    console.log(`Exported ${messages.length} messages from local MongoDB`);
    console.log(`Exported ${events.length} events from local MongoDB`);
    console.log(`Exported ${timetables.length} timetables from local MongoDB`);

    // Disconnect from local MongoDB
    await disconnectFromMongoDB();

    return { users, attendance, leaves, messages, events, timetables };
  } catch (error) {
    console.error('Error exporting data from local MongoDB:', error);
    throw error;
  }
};

// Function to import data to Atlas MongoDB
const importDataToAtlasDB = async (data) => {
  try {
    // Connect to Atlas MongoDB
    if (!(await connectToMongoDB(ATLAS_DB_URL))) {
      throw new Error('Failed to connect to Atlas MongoDB');
    }

    // Clear existing data from Atlas MongoDB
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Message.deleteMany({});
    await Event.deleteMany({});
    await Timetable.deleteMany({});

    console.log('Cleared existing data from Atlas MongoDB');

    // Import data to Atlas MongoDB
    if (data.users.length > 0) {
      await User.insertMany(data.users);
      console.log(`Imported ${data.users.length} users to Atlas MongoDB`);
    }

    if (data.attendance.length > 0) {
      await Attendance.insertMany(data.attendance);
      console.log(`Imported ${data.attendance.length} attendance records to Atlas MongoDB`);
    }

    if (data.leaves.length > 0) {
      await Leave.insertMany(data.leaves);
      console.log(`Imported ${data.leaves.length} leave records to Atlas MongoDB`);
    }

    if (data.messages.length > 0) {
      await Message.insertMany(data.messages);
      console.log(`Imported ${data.messages.length} messages to Atlas MongoDB`);
    }

    if (data.events.length > 0) {
      await Event.insertMany(data.events);
      console.log(`Imported ${data.events.length} events to Atlas MongoDB`);
    }

    if (data.timetables.length > 0) {
      await Timetable.insertMany(data.timetables);
      console.log(`Imported ${data.timetables.length} timetables to Atlas MongoDB`);
    }

    // Disconnect from Atlas MongoDB
    await disconnectFromMongoDB();

    return true;
  } catch (error) {
    console.error('Error importing data to Atlas MongoDB:', error);
    throw error;
  }
};

// Main function
const migrateData = async () => {
  try {
    console.log('Starting data migration...');

    // Export data from local MongoDB
    const data = await exportDataFromLocalDB();

    // Import data to Atlas MongoDB
    await importDataToAtlasDB(data);

    console.log('Data migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Data migration failed:', error);
    process.exit(1);
  }
};

// Start migration
migrateData(); 