const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true
  },
  courseName: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  facultyName: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Deadline date is required']
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
