const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['attendance', 'message', 'assignment', 'leave', 'event', 'login', 'logout'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index on createdAt for sorting and faculty ID for filtering
activitySchema.index({ createdAt: -1, faculty: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity; 