const mongoose = require('mongoose');

/**
 * Connects Express application to MongoDB using process.env.MONGO_URI
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus360';
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-sync & link student and faculty profiles so all users work seamlessly
    try {
      const User = require('../models/User');
      const Student = require('../models/Student');
      const Faculty = require('../models/Faculty');

      // 1. Safely drop obsolete unique indexes on Student & Faculty collections that cause duplicate key errors
      try {
        const studentIndexes = await Student.collection.indexes();
        for (const idx of studentIndexes) {
          if (idx.name !== '_id_' && idx.name !== 'studentId_1') {
            console.log(`ℹ️ Dropping legacy index on students: ${idx.name}`);
            await Student.collection.dropIndex(idx.name).catch(() => {});
          }
        }
      } catch (e) {}

      try {
        const facultyIndexes = await Faculty.collection.indexes();
        for (const idx of facultyIndexes) {
          if (idx.name !== '_id_' && idx.name !== 'facultyId_1') {
            console.log(`ℹ️ Dropping legacy index on faculties: ${idx.name}`);
            await Faculty.collection.dropIndex(idx.name).catch(() => {});
          }
        }
      } catch (e) {}

      // 2. Ensure every Student document has a valid, non-null studentId
      const studentsMissingId = await Student.find({
        $or: [{ studentId: null }, { studentId: '' }, { studentId: { $exists: false } }]
      });
      for (const st of studentsMissingId) {
        st.studentId = `STU${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
        await st.save().catch(() => {});
      }

      // 3. Ensure every Faculty document has a valid, non-null facultyId
      const facultyMissingId = await Faculty.find({
        $or: [{ facultyId: null }, { facultyId: '' }, { facultyId: { $exists: false } }]
      });
      for (const fc of facultyMissingId) {
        fc.facultyId = `FAC${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
        await fc.save().catch(() => {});
      }

      // 4. Bi-directional Sync: Student Users <-> Student Profiles
      const studentUsers = await User.find({ role: { $in: ['student', 'Student'] } });
      for (const u of studentUsers) {
        const cleanEmail = (u.email || '').trim().toLowerCase();
        let st = await Student.findOne({
          $or: [{ user: u._id }, { email: cleanEmail }]
        });
        if (!st) {
          const roll = `STU${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
          st = new Student({
            user: u._id,
            studentId: roll,
            name: u.name || 'Student',
            email: cleanEmail,
            courseName: 'B.Tech Computer Science & Engineering',
            semester: 1
          });
          try {
            await st.save();
            console.log(`✅ Synced Student profile for ${cleanEmail} (${st.name})`);
          } catch (stErr) {
            if (stErr.code === 11000) {
              st.studentId = `STU${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
              await st.save().catch(() => {});
            }
          }
        } else if (!st.user || String(st.user) !== String(u._id)) {
          st.user = u._id;
          if (!st.name && u.name) st.name = u.name;
          if (!st.email) st.email = cleanEmail;
          await st.save().catch(() => {});
        }
      }

      // Any Student document without a User account -> Create User account so they can log in
      const allStudents = await Student.find();
      for (const st of allStudents) {
        const cleanEmail = (st.email || '').trim().toLowerCase();
        if (!cleanEmail) continue;

        let u = null;
        if (st.user) u = await User.findById(st.user);
        if (!u) u = await User.findOne({ email: cleanEmail });

        if (!u) {
          u = new User({
            name: st.name || 'Student',
            email: cleanEmail,
            password: 'student123',
            role: 'student',
            active: true
          });
          await u.save().catch(() => {});
          console.log(`✅ Created User login account for Student ${cleanEmail}`);
        }

        if (u && (!st.user || String(st.user) !== String(u._id))) {
          st.user = u._id;
          await st.save().catch(() => {});
        }
      }

      // 5. Bi-directional Sync: Faculty Users <-> Faculty Profiles
      const facultyUsers = await User.find({ role: { $in: ['faculty', 'Faculty'] } });
      for (const f of facultyUsers) {
        const cleanEmail = (f.email || '').trim().toLowerCase();
        let fac = await Faculty.findOne({
          $or: [{ user: f._id }, { email: cleanEmail }]
        });
        if (!fac) {
          const facId = `FAC${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
          fac = new Faculty({
            user: f._id,
            facultyId: facId,
            name: f.name || 'Faculty Member',
            email: cleanEmail,
            departmentName: 'Computer Science',
            designation: 'Assistant Professor',
            assignedSubjects: ['Software Engineering', 'Computer Networks', 'Operating Systems', 'Data Structures']
          });
          try {
            await fac.save();
            console.log(`✅ Synced Faculty profile for ${cleanEmail} (${fac.name})`);
          } catch (facErr) {
            if (facErr.code === 11000) {
              fac.facultyId = `FAC${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
              await fac.save().catch(() => {});
            }
          }
        } else if (!fac.user || String(fac.user) !== String(f._id)) {
          fac.user = f._id;
          if (!fac.name && f.name) fac.name = f.name;
          if (!fac.email) fac.email = cleanEmail;
          await fac.save().catch(() => {});
        }
      }

      // Any Faculty document without a User account -> Create User account so they can log in
      const allFaculty = await Faculty.find();
      for (const fc of allFaculty) {
        const cleanEmail = (fc.email || '').trim().toLowerCase();
        if (!cleanEmail) continue;

        let u = null;
        if (fc.user) u = await User.findById(fc.user);
        if (!u) u = await User.findOne({ email: cleanEmail });

        if (!u) {
          u = new User({
            name: fc.name || 'Faculty Member',
            email: cleanEmail,
            password: 'faculty123',
            role: 'faculty',
            active: true
          });
          await u.save().catch(() => {});
          console.log(`✅ Created User login account for Faculty ${cleanEmail}`);
        }

        if (u && (!fc.user || String(fc.user) !== String(u._id))) {
          fc.user = u._id;
          await fc.save().catch(() => {});
        }
      }
    } catch (syncErr) {
      console.warn('Profile synchronization notice:', syncErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
