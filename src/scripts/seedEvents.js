const mongoose = require('mongoose');
const Event = require('../models/Event');
const seedEvents = require('../data/seedEvents');

const seedEventsData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Delete existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Insert seed events
    const events = await Event.insertMany(seedEvents);
    console.log(`Seeded ${events.length} events successfully`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding events:', error);
    process.exit(1);
  }
};

seedEventsData(); 