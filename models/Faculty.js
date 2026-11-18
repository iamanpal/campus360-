const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyId: {
    type: String,
    required: [true, 'Faculty ID is required'],
    unique: true,
    sparse: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Faculty email is required'],
    trim: true,
    lowercase: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  departmentName: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    default: 'Assistant Professor',
    trim: true
  },
  assignedSubjects: [{
    type: String,
    trim: true
  }],
  phone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
