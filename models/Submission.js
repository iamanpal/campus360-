const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    trim: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    trim: true
  },
  attachmentUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true,
    default: ''
  },
  fileType: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Late'],
    default: 'Submitted'
  },
  marksObtained: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
