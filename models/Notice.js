const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Academic', 'Exam', 'Event', 'General'],
    default: 'General'
  },
  content: {
    type: String,
    required: [true, 'Notice content is required'],
    trim: true
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  relatedDocument: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);
