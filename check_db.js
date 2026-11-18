const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

async function check() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus360';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected!');

    const users = await User.find({}, 'name email role active');
    console.log('=== USERS ===');
    console.log(JSON.stringify(users, null, 2));

    const students = await Student.find({});
    console.log('=== STUDENTS ===');
    console.log(JSON.stringify(students, null, 2));

    const faculties = await Faculty.find({});
    console.log('=== FACULTIES ===');
    console.log(JSON.stringify(faculties, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Check Error:', err);
    process.exit(1);
  }
}

check();
