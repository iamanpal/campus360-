const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    trim: true
  },
  facultyName: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
