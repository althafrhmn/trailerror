const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    academicYear: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    schedule: {
      type: Map,
      of: [{
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject'
        },
        faculty: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        startTime: String,
        endTime: String
      }]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Static method to get all active classes
classSchema.statics.getActiveClasses = function() {
  return this.find({ isActive: true })
    .sort({ name: 1 })
    .populate('classTeacher', 'name')
    .exec();
};

// Static method to get class with students
classSchema.statics.getClassWithStudents = function(classId) {
  return this.findById(classId)
    .populate({
      path: 'students',
      select: 'name studentInfo.rollNo',
      match: { 'studentInfo.isActive': true }
    })
    .exec();
};

const Class = mongoose.model('Class', classSchema);

module.exports = Class; 