const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Medical', 'Personal', 'Family', 'Exam', 'Event', 'Other'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  comments: {
    type: String,
    default: '',
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  parentApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    date: Date,
  },
  facultyApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    date: Date,
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: String,
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
  lastEditedAt: Date,
  notificationsSent: {
    parent: { type: Boolean, default: false },
    faculty: { type: Boolean, default: false },
    student: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

// Middleware to update lastEditedAt
leaveSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastEditedAt = new Date();
  }
  next();
});

// Static method to check if student can edit leave
leaveSchema.statics.canEdit = function(leaveId, studentId) {
  return this.findOne({
    _id: leaveId,
    student: studentId,
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }, // 15 minutes
  });
};

// Create indexes for better query performance
leaveSchema.index({ student: 1, status: 1 });
leaveSchema.index({ faculty: 1, status: 1 });
leaveSchema.index({ createdAt: -1 });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave; 