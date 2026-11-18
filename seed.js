const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const Notice = require('./models/Notice');
const Gallery = require('./models/Gallery');
const Attendance = require('./models/Attendance');
const Submission = require('./models/Submission');
const Result = require('./models/Result');
const LeaveRequest = require('./models/LeaveRequest');
const Assignment = require('./models/Assignment');
const seedUsers = require('./scripts/seedUsers');

const sampleCourses = [
  {
    name: 'B.Tech Computer Science & Engineering',
    code: 'BTECH-CSE',
    department: 'Computer Science',
    duration: '4 Years (8 Semesters)',
    seats: 120,
    subjects: [
      'Software Engineering',
      'Computer Networks',
      'Economics for Engineers',
      'Design Analysis and Algorithms',
      'Operating Systems',
      'Compiler Design',
      'Data Structures',
      'Database Systems',
      'AI & ML',
      'Web Development'
    ]
  },
  {
    name: 'B.Sc Information Technology',
    code: 'BSC-IT',
    department: 'Computer Science',
    duration: '3 Years (6 Semesters)',
    seats: 60,
    description: 'Focused on application development, network management, cloud computing, and cybersecurity fundamentals.',
    subjects: ['Programming in C/C++', 'Web Technologies', 'Computer Networks', 'Cloud Computing', 'Information Security']
  },
  {
    name: 'B.Tech Electronics & Communication',
    code: 'BTECH-ECE',
    department: 'Electronics',
    duration: '4 Years (8 Semesters)',
    seats: 90,
    description: 'Covers VLSI design, signal processing, embedded systems, robotics, and wireless communications.',
    subjects: ['Digital Electronics', 'Signals & Systems', 'Microprocessors', 'VLSI Design', 'Embedded Systems']
  },
  {
    name: 'B.Tech Mechanical Engineering',
    code: 'BTECH-ME',
    department: 'Mechanical',
    duration: '4 Years (8 Semesters)',
    seats: 60,
    description: 'In-depth exposure to thermodynamics, CAD/CAM design, robotics, automotive engineering, and fluid mechanics.',
    subjects: ['Thermodynamics', 'Fluid Mechanics', 'CAD/CAM', 'Manufacturing Tech', 'Robotics']
  },
  {
    name: 'Bachelor of Business Administration (BBA)',
    code: 'BBA',
    department: 'Management',
    duration: '3 Years (6 Semesters)',
    seats: 80,
    description: 'Prepares students for management roles with training in finance, marketing, human resources, and business analytics.',
    subjects: ['Financial Accounting', 'Principles of Management', 'Marketing Strategy', 'Business Law', 'HR Management']
  },
  {
    name: 'Bachelor of Computer Applications (BCA)',
    code: 'BCA',
    department: 'Computer Science',
    duration: '3 Years (6 Semesters)',
    seats: 90,
    description: 'Practical degree in computer software development, database administration, web design, and IT management.',
    subjects: ['Object Oriented Programming', 'DBMS', 'Software Engineering', 'Java Programming', 'Full Stack Web']
  }
];

const sampleNotices = [
  {
    title: 'Autumn End-Semester Examination Schedule Released',
    category: 'Exam',
    content: 'The official end-semester examination timetable for all undergraduate and postgraduate engineering courses has been published. Examinations commence on October 15, 2026. Students can view their detailed seating plan in the student portal.',
    publishedDate: new Date('2026-09-20')
  },
  {
    title: 'Campus Placement Drive 2026: Top Tech Recruiters',
    category: 'General',
    content: 'Campus Placement Cell announces the commencement of Phase 1 Placement Drive starting from October 1st. Over 40 multinational companies including major IT and core engineering firms will participate. Eligible final year students must register.',
    publishedDate: new Date('2026-09-18')
  },
  {
    title: 'National Level Hackathon & TechSymposium Registration',
    category: 'Event',
    content: 'Department of Computer Science is organizing a 36-hour National Level Hackathon "CodeStorm 2026" on October 8-9. Exciting cash prizes worth $5000 to be won. Team registrations are now open for all enrolled students.',
    publishedDate: new Date('2026-09-15')
  },
  {
    title: 'Submissions Open for Mid-Term Assignments (Odd Semester)',
    category: 'Academic',
    content: 'All faculty members have uploaded mid-term assignment modules. Enrolled students are advised to check their student portal assignment section and submit responses prior to the stated deadline of October 5th.',
    publishedDate: new Date('2026-09-12')
  }
];

const sampleGallery = [
  { title: 'Central Academic Library & Study Commons', category: 'Facilities', imagePath: '📚', description: 'Modern digital library with over 85,000 volumes.' },
  { title: 'Annual TechFest Exhibition 2026', category: 'Events', imagePath: '🏆', description: 'Student robotics & coding project showcase.' },
  { title: 'Advanced Computer & AI Research Lab', category: 'Facilities', imagePath: '💻', description: 'High-performance computing laboratory.' },
  { title: 'Inter-College Basketball Tournament', category: 'Sports', imagePath: '🏀', description: 'Athletic championship held at central sports complex.' },
  { title: 'State-of-the-Art Auditorium', category: 'Campus', imagePath: '🏛️', description: '1,200 seat convention hall.' },
  { title: 'Green Campus & Central Plaza', category: 'Campus', imagePath: '🌳', description: 'Eco-friendly student courtyard.' }
];

async function seedData() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus360';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
      console.log('🔗 Connected to MongoDB for seeding...');
    }

    // Safely drop old indexes on Course collection if any stale code_1 index exists
    try {
      await Course.collection.dropIndexes();
    } catch (e) {
      // Ignore if collection or index doesn't exist yet
    }

    // Clean existing collection data for public site content
    await Course.deleteMany({});
    await Notice.deleteMany({});
    await Gallery.deleteMany({});

    // Seed Courses, Notices, and Gallery items for public site
    await Course.insertMany(sampleCourses);
    await Notice.insertMany(sampleNotices);
    await Gallery.insertMany(sampleGallery);
    console.log('🌱 Sample Courses, Notices, and Gallery seeded successfully!');

    // Clean any previous test/mock student data so database starts completely clean
    await Attendance.deleteMany({});
    await Submission.deleteMany({});
    await Result.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Assignment.deleteMany({});

    // Seed ONLY the Admin account (zero default student or faculty accounts)
    await seedUsers(true);

    console.log('\n🎉 Campus 360 database initialization completed successfully!');
    console.log('ℹ️ No default student or faculty accounts exist. You can now add them directly via Admin Portal.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedData();
