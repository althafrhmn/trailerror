const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['system', 'user', 'notification'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  relatedTo: {
    type: String,
    enum: ['profile_update', 'user_creation', 'user_update', 'user_deletion', 'general'],
    default: 'general'
  },
  metadata: {
    userId: mongoose.Schema.Types.ObjectId,
    action: String,
    details: Object
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ receiver: 1, status: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 