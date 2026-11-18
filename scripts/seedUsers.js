const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

async function seedUsers(skipDisconnect = false) {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus360';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
      console.log('🔗 Connected to MongoDB for seeding authentication users...');
    }

    // Remove dummy/sample student and faculty test accounts so database has NO default student/faculty
    await User.deleteMany({ email: { $in: ['student@campus360.edu', 'faculty@campus360.edu'] } });
    await Student.deleteMany({ studentId: 'STU2026001' });
    await Faculty.deleteMany({ facultyId: 'FAC2026001' });

    // Ensure Admin User exists (only Admin by default, so admin can login and create student/faculty)
    let adminUser = await User.findOne({ email: 'admin@campus360.edu' });
    if (!adminUser) {
      adminUser = new User({
        name: 'System Administrator',
        email: 'admin@campus360.edu',
        password: 'admin123',
        role: 'admin',
        active: true
      });
      await adminUser.save();
      console.log('✅ Created Admin user: admin@campus360.edu / admin123');
    } else {
      console.log('ℹ️ Admin user already exists: admin@campus360.edu');
    }

    console.log('ℹ️ By default, NO student or faculty accounts are pre-entered in the database.');
    console.log('ℹ️ Admin can create students and teachers from the Admin Portal.');

    if (!skipDisconnect) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error in seedUsers:', error);
    if (!skipDisconnect) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
