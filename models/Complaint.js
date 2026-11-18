const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  subject: {
    type: String,
    required: [true, 'Complaint subject is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
