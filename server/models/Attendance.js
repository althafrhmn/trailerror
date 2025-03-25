const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lateArrivalTime: {
    type: Date,
  },
  remarks: String,
  notificationSent: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

// Static method to calculate attendance percentage
attendanceSchema.statics.calculateAttendance = async function(studentId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        lateCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      percentage: 0,
      totalClasses: 0,
      presentCount: 0,
      lateCount: 0,
    };
  }

  const stats = result[0];
  const percentage = ((stats.presentCount + stats.lateCount) / stats.totalClasses) * 100;

  return {
    percentage: Math.round(percentage * 100) / 100,
    totalClasses: stats.totalClasses,
    presentCount: stats.presentCount,
    lateCount: stats.lateCount,
  };
};

// Create a unique compound index on student, date, and subject fields
attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 