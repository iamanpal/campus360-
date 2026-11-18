const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  departmentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  seats: {
    type: Number,
    required: [true, 'Available seats count is required'],
    default: 60
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
