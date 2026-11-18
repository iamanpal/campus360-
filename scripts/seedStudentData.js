const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const StudyMaterial = require('../models/StudyMaterial');
const LeaveRequest = require('../models/LeaveRequest');

async function seedStudentData(skipDisconnect = false) {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus360';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
      console.log('🔗 Connected to MongoDB for Student Data seeding...');
    }

    // 1. Find or create Student user
    let user = await User.findOne({ email: 'student@campus360.edu' });
    if (!user) {
      user = new User({
        name: 'Alex Johnson',
        email: 'student@campus360.edu',
        password: 'student123',
        role: 'student',
        active: true
      });
      await user.save();
    }

    let student = await Student.findOne({ user: user._id });
    if (!student) {
      student = new Student({
        user: user._id,
        studentId: 'STU2026001',
        name: user.name,
        email: user.email,
        courseName: 'B.Tech Computer Science & Engineering',
        semester: 4,
        phone: '+1 (555) 0199',
        guardianName: 'Mark Johnson'
      });
      await student.save();
    }

    // Clean previous records for student
    await Attendance.deleteMany({ student: student._id });
    await Result.deleteMany({ student: student._id });
    await Submission.deleteMany({ student: student._id });
    await LeaveRequest.deleteMany({ student: student._id });
    await Timetable.deleteMany({ semester: { $in: [4, 5] } });
    await Assignment.deleteMany({});
    await StudyMaterial.deleteMany({});

    // 2. Seed Attendance Records
    const subjects = [
      'Software Engineering',
      'Computer Networks',
      'Economics for Engineers',
      'Design Analysis and Algorithms',
      'Operating Systems',
      'Compiler Design',
      'Data Structures',
      'Database Systems'
    ];
    const attendanceRecords = [];

    subjects.forEach((subj, idx) => {
      // 15 classes per subject
      for (let i = 1; i <= 15; i++) {
        // Create low attendance on Operating Systems for demo (<75%)
        const isAbsent = (subj === 'Operating Systems' && i % 3 === 0) || (i % 8 === 0);
        attendanceRecords.push({
          student: student._id,
          subject: subj,
          date: new Date(Date.now() - i * 86400000),
          status: isAbsent ? 'Absent' : 'Present'
        });
      }
    });
    await Attendance.insertMany(attendanceRecords);
    console.log('✅ Seeded Attendance records.');

    // 3. Seed Timetable Slots
    const timetableData = [
      // Semester 4 Schedule
      { semester: 4, day: 'Monday', startTime: '09:00 AM', endTime: '10:30 AM', subject: 'Data Structures', facultyName: 'Dr. Alan Turing', room: 'Lab 301' },
      { semester: 4, day: 'Monday', startTime: '10:45 AM', endTime: '12:15 PM', subject: 'Operating Systems', facultyName: 'Prof. Grace Hopper', room: 'Hall 102' },
      { semester: 4, day: 'Tuesday', startTime: '09:00 AM', endTime: '10:30 AM', subject: 'Database Systems', facultyName: 'Dr. Edgar Codd', room: 'Lab 204' },
      { semester: 4, day: 'Tuesday', startTime: '11:00 AM', endTime: '12:30 PM', subject: 'Web Development', facultyName: 'Prof. Tim Berners', room: 'Lab 305' },
      { semester: 4, day: 'Wednesday', startTime: '09:30 AM', endTime: '11:00 AM', subject: 'AI & ML', facultyName: 'Dr. Marvin Minsky', room: 'Auditorium B' },
      { semester: 4, day: 'Thursday', startTime: '10:00 AM', endTime: '11:30 AM', subject: 'Data Structures', facultyName: 'Dr. Alan Turing', room: 'Lab 301' },
      { semester: 4, day: 'Friday', startTime: '02:00 PM', endTime: '03:30 PM', subject: 'Database Systems', facultyName: 'Dr. Edgar Codd', room: 'Lab 204' },

      // Semester 5 Schedule (Core 5th Sem Subjects)
      { semester: 5, day: 'Monday', startTime: '09:00 AM', endTime: '10:30 AM', subject: 'Software Engineering', facultyName: 'Prof. Grace Hopper', room: 'Hall 201' },
      { semester: 5, day: 'Monday', startTime: '10:45 AM', endTime: '12:15 PM', subject: 'Computer Networks', facultyName: 'Dr. Vint Cerf', room: 'Lab 105' },
      { semester: 5, day: 'Tuesday', startTime: '09:00 AM', endTime: '10:30 AM', subject: 'Design Analysis and Algorithms', facultyName: 'Dr. Alan Turing', room: 'Lab 301' },
      { semester: 5, day: 'Tuesday', startTime: '11:00 AM', endTime: '12:30 PM', subject: 'Operating Systems', facultyName: 'Prof. Ken Thompson', room: 'Lab 202' },
      { semester: 5, day: 'Wednesday', startTime: '09:30 AM', endTime: '11:00 AM', subject: 'Economics for Engineers', facultyName: 'Dr. Adam Smith', room: 'Room 404' },
      { semester: 5, day: 'Thursday', startTime: '10:00 AM', endTime: '11:30 AM', subject: 'Compiler Design', facultyName: 'Dr. Alfred Aho', room: 'Lab 302' },
      { semester: 5, day: 'Friday', startTime: '02:00 PM', endTime: '03:30 PM', subject: 'Software Engineering', facultyName: 'Prof. Grace Hopper', room: 'Lab 101' }
    ];
    await Timetable.insertMany(timetableData);
    console.log('✅ Seeded Timetable schedule.');

    // 4. Seed Assignments
    const assign1 = await Assignment.create({
      title: 'Binary Search Tree & Graph Traversal Implementation',
      description: 'Implement AVL Trees and Dijkstra Algorithm in C++/Java with time complexity analysis.',
      courseName: 'B.Tech Computer Science & Engineering',
      subject: 'Data Structures',
      facultyName: 'Dr. Alan Turing',
      dueDate: new Date(Date.now() + 5 * 86400000), // 5 days in future
      totalMarks: 100
    });

    const assign2 = await Assignment.create({
      title: 'Relational Schema Normalization & SQL Queries',
      description: 'Normalize given unnormalized table into 3NF and BCNF with SQL DDL queries.',
      courseName: 'B.Tech Computer Science & Engineering',
      subject: 'Database Systems',
      facultyName: 'Dr. Edgar Codd',
      dueDate: new Date(Date.now() + 10 * 86400000), // 10 days in future
      totalMarks: 100
    });

    const assign3 = await Assignment.create({
      title: 'Process Scheduling Simulation in C',
      description: 'Simulate Round Robin and Shortest Job First scheduling algorithms.',
      courseName: 'B.Tech Computer Science & Engineering',
      subject: 'Operating Systems',
      facultyName: 'Prof. Grace Hopper',
      dueDate: new Date(Date.now() - 2 * 86400000), // Past due
      totalMarks: 100
    });

    // Seed 1 submission
    await Submission.create({
      assignment: assign3._id,
      student: student._id,
      studentName: student.name,
      content: 'https://github.com/alexjohnson/os-scheduler-simulation',
      attachmentUrl: 'https://github.com/alexjohnson/os-scheduler-simulation',
      submissionDate: new Date(Date.now() - 3 * 86400000),
      status: 'Submitted',
      marksObtained: 92,
      feedback: 'Excellent scheduling algorithm logic and modular code.'
    });
    console.log('✅ Seeded Assignments & Submissions.');

    // 5. Seed Exam Results
    const resultsData = [
      { student: student._id, semester: 1, subject: 'Mathematics I', marksObtained: 88, maxMarks: 100, grade: 'A' },
      { student: student._id, semester: 1, subject: 'Computer Programming', marksObtained: 94, maxMarks: 100, grade: 'A+' },
      { student: student._id, semester: 2, subject: 'Digital Logic Design', marksObtained: 82, maxMarks: 100, grade: 'A' },
      { student: student._id, semester: 2, subject: 'Object Oriented Programming', marksObtained: 90, maxMarks: 100, grade: 'A+' },
      { student: student._id, semester: 3, subject: 'Data Structures', marksObtained: 85, maxMarks: 100, grade: 'A' },
      { student: student._id, semester: 3, subject: 'Discrete Mathematics', marksObtained: 78, maxMarks: 100, grade: 'B+' }
    ];
    await Result.insertMany(resultsData);
    console.log('✅ Seeded Exam Results.');

    // 6. Seed Study Materials
    const materialsData = [
      { title: 'Lecture 04: Advanced Graph Algorithms (PDF)', description: 'Complete notes on BFS, DFS, Dijkstra, and Kruskal algorithms.', subject: 'Data Structures', courseName: 'B.Tech CS', facultyName: 'Dr. Alan Turing', fileUrl: 'https://campus360.edu/docs/graph-algorithms.pdf' },
      { title: 'Normalization Cheatsheet & ER Diagrams', description: 'Quick revision reference for 1NF, 2NF, 3NF, BCNF.', subject: 'Database Systems', courseName: 'B.Tech CS', facultyName: 'Dr. Edgar Codd', fileUrl: 'https://campus360.edu/docs/db-normalization.pdf' },
      { title: 'Process Scheduling & Deadlocks Module', description: 'Comprehensive guide covering Semaphore, Mutex, and Banker Algorithm.', subject: 'Operating Systems', courseName: 'B.Tech CS', facultyName: 'Prof. Grace Hopper', fileUrl: 'https://campus360.edu/docs/os-scheduling.pdf' }
    ];
    await StudyMaterial.insertMany(materialsData);
    console.log('✅ Seeded Study Materials.');

    // 7. Seed Leave Request
    await LeaveRequest.create({
      student: student._id,
      studentName: student.name,
      reason: 'Attending National Level Coding Hackathon',
      startDate: new Date(Date.now() + 3 * 86400000),
      endDate: new Date(Date.now() + 5 * 86400000),
      description: 'Selected for final round of CodeStorm 2026 hackathon at Tech City.',
      status: 'Pending'
    });
    console.log('✅ Seeded Leave Request.');

    console.log('🎉 Complete Student Portal academic dataset seeded successfully!');
    if (!skipDisconnect) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error seeding student data:', error);
    if (!skipDisconnect) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

if (require.main === module) {
  seedStudentData();
}

module.exports = seedStudentData;
