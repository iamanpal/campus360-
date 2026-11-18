const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const LeaveRequest = require('../models/LeaveRequest');
const Assignment = require('../models/Assignment');

async function cleanDefaultUsers() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus360';
    await mongoose.connect(mongoURI);
    console.log('🔗 Connected to MongoDB...');

    // Delete default/dummy students and faculty accounts
    await User.deleteMany({ email: { $in: ['student@campus360.edu', 'faculty@campus360.edu'] } });
    await Student.deleteMany({ studentId: 'STU2026001' });
    await Faculty.deleteMany({ facultyId: 'FAC2026001' });

    // Clean mock student academic records
    await Attendance.deleteMany({});
    await Submission.deleteMany({});
    await Result.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Assignment.deleteMany({});

    console.log('✅ Default student and faculty dummy entries have been completely cleared from the database.');
    console.log('✅ From now on, students and faculty will ONLY exist when you add them yourself from the Admin Portal.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning default users:', error);
    process.exit(1);
  }
}

cleanDefaultUsers();
