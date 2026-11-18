const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const StudyMaterial = require('../models/StudyMaterial');
const LeaveRequest = require('../models/LeaveRequest');
const Notice = require('../models/Notice');

/**
 * Helper: Resolve Student document associated with authenticated User
 * Handles email-matching, auto-linking, guaranteed unique roll numbers, and safe fallback.
 */
async function resolveStudent(userId) {
  try {
    // 1. Direct match by user ObjectId
    let student = await Student.findOne({ user: userId });
    if (student) return student;

    // 2. Fetch User document
    const user = await User.findById(userId);
    if (!user) return null;

    const cleanEmail = (user.email || '').trim().toLowerCase();

    // 3. Match by email in case user reference was unlinked or student record was created first
    student = await Student.findOne({ email: cleanEmail });
    if (student) {
      student.user = user._id;
      if (!student.name && user.name) student.name = user.name;
      if (!student.email) student.email = cleanEmail;
      await student.save().catch(() => {});
      return student;
    }

    // 4. Create new Student record with guaranteed unique roll number
    const uniqueRoll = `STU${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    student = new Student({
      user: user._id,
      studentId: uniqueRoll,
      name: user.name || 'Student',
      email: cleanEmail,
      courseName: 'B.Tech Computer Science & Engineering',
      semester: 1
    });

    try {
      await student.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        // Handle concurrent insert or duplicate studentId
        const existing = await Student.findOne({
          $or: [{ user: user._id }, { email: cleanEmail }]
        });
        if (existing) {
          existing.user = user._id;
          await existing.save().catch(() => {});
          return existing;
        }
        student.studentId = `STU${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
        await student.save();
      } else {
        throw saveErr;
      }
    }

    return student;
  } catch (err) {
    console.error('resolveStudent Error:', err);
    try {
      const user = await User.findById(userId);
      if (user) {
        const fallback = await Student.findOne({ email: (user.email || '').trim().toLowerCase() });
        if (fallback) return fallback;
      }
    } catch (e) {}
    return null;
  }
}

/**
 * @route   GET /api/student/dashboard
 * @desc    Get Student Dashboard summary metrics
 * @access  Private (Student)
 */
const getDashboard = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // 1. Calculate overall attendance %
    const attendanceRecords = await Attendance.find({ student: student._id });
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(a => a.status === 'Present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    // 2. Count pending assignments & fetch recent assignments
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    const submissions = await Submission.find({ student: student._id });
    const submittedAssignmentIds = submissions.map(s => s.assignment.toString());
    const pendingAssignmentsCount = assignments.filter(a => !submittedAssignmentIds.includes(a._id.toString())).length;

    const recentAssignments = assignments.slice(0, 4).map(a => ({
      _id: a._id,
      title: a.title,
      subject: a.subject,
      facultyName: a.facultyName || 'Faculty Instructor',
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      hasSubmitted: submittedAssignmentIds.includes(a._id.toString()),
      hasPhoto: Boolean(a.imageUrl)
    }));

    // 3. Count pending leave requests
    const pendingLeavesCount = await LeaveRequest.countDocuments({ student: student._id, status: 'Pending' });

    // 4. Fetch recent notices
    const recentNotices = await Notice.find().sort({ publishedDate: -1, createdAt: -1 }).limit(3);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.studentId,
          name: student.name,
          email: student.email,
          courseName: student.courseName || 'B.Tech Computer Science & Engineering',
          semester: student.semester || 4
        },
        metrics: {
          attendancePercentage,
          totalClasses,
          presentClasses,
          pendingAssignmentsCount,
          pendingLeavesCount
        },
        recentNotices,
        recentAssignments
      }
    });
  } catch (error) {
    console.error('Student Dashboard API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard summary.' });
  }
};

/**
 * @route   GET /api/student/attendance
 * @desc    Get Student subject-wise attendance breakdown
 * @access  Private (Student)
 */
const getAttendance = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const attendanceRecords = await Attendance.find({ student: student._id }).sort({ date: -1 });

    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(a => a.status === 'Present').length;
    const absentClasses = totalClasses - presentClasses;
    const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    // Group by Subject
    const subjectMap = {};
    attendanceRecords.forEach(record => {
      const subj = record.subject || 'General';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { subject: subj, total: 0, present: 0, absent: 0, percentage: 100 };
      }
      subjectMap[subj].total += 1;
      if (record.status === 'Present') {
        subjectMap[subj].present += 1;
      } else {
        subjectMap[subj].absent += 1;
      }
    });

    const subjectBreakdown = Object.values(subjectMap).map(item => {
      item.percentage = Math.round((item.present / item.total) * 100);
      item.isLow = item.percentage < 75;
      return item;
    });

    return res.status(200).json({
      success: true,
      data: {
        overallPercentage,
        totalClasses,
        presentClasses,
        absentClasses,
        isLowOverall: overallPercentage < 75,
        subjectBreakdown,
        logs: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Student Attendance API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching attendance details.' });
  }
};

/**
 * @route   GET /api/student/timetable
 * @desc    Get Student class schedule
 * @access  Private (Student)
 */
const getTimetable = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    let schedule = await Timetable.find({ semester: student.semester || 5 }).sort({ startTime: 1 });
    if (!schedule || schedule.length === 0) {
      schedule = await Timetable.find().sort({ semester: 1, startTime: 1 });
    }

    return res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Student Timetable API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching timetable.' });
  }
};

/**
 * @route   GET /api/student/assignments
 * @desc    Get Student assignments & submission status
 * @access  Private (Student)
 */
const getAssignments = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const assignments = await Assignment.find().sort({ createdAt: -1 });
    const submissions = await Submission.find({ student: student._id });

    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    const assignmentList = assignments.map(assign => {
      const sub = submissionMap[assign._id.toString()];
      const isPastDue = new Date() > new Date(assign.dueDate);

      let status = 'Pending';
      if (sub) {
        status = sub.status || 'Submitted';
      } else if (isPastDue) {
        status = 'Late';
      }

      return {
        _id: assign._id,
        title: assign.title,
        description: assign.description,
        subject: assign.subject,
        facultyName: assign.facultyName || 'Faculty Instructor',
        dueDate: assign.dueDate,
        totalMarks: assign.totalMarks,
        imageUrl: assign.imageUrl || '',
        status,
        submission: sub || null
      };
    });

    return res.status(200).json({
      success: true,
      data: assignmentList
    });
  } catch (error) {
    console.error('Student Assignments API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assignments.' });
  }
};

/**
 * @route   POST /api/student/assignments/:assignmentId/submit
 * @desc    Submit assignment response for authenticated student
 * @access  Private (Student)
 */
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, attachmentUrl, fileName, fileType } = req.body;

    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (!content && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Please provide submission content or attach a photo/PDF document.' });
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const submissionStatus = isLate ? 'Late' : 'Submitted';

    let submission = await Submission.findOne({ assignment: assignmentId, student: student._id });
    if (submission) {
      if (content !== undefined) submission.content = content;
      if (attachmentUrl !== undefined) submission.attachmentUrl = attachmentUrl;
      if (fileName !== undefined) submission.fileName = fileName;
      if (fileType !== undefined) submission.fileType = fileType;
      submission.submissionDate = new Date();
      submission.status = submissionStatus;
    } else {
      submission = new Submission({
        assignment: assignmentId,
        student: student._id,
        studentName: student.name,
        content: content || '',
        attachmentUrl: attachmentUrl || '',
        fileName: fileName || '',
        fileType: fileType || '',
        submissionDate: new Date(),
        status: submissionStatus
      });
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: `Assignment submitted successfully (${submissionStatus}).`,
      data: submission
    });
  } catch (error) {
    console.error('Submit Assignment API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting assignment.' });
  }
};

/**
 * @route   GET /api/student/results
 * @desc    Get Student academic exam results
 * @access  Private (Student)
 */
const getResults = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const results = await Result.find({ student: student._id }).sort({ semester: 1 });

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Student Results API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching results.' });
  }
};

/**
 * @route   GET /api/student/materials
 * @desc    Get Study Materials for student
 * @access  Private (Student)
 */
const getStudyMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find().sort({ uploadDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Student StudyMaterials API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching study materials.' });
  }
};

/**
 * @route   GET /api/student/leaves
 * @desc    Get Student leave request history
 * @access  Private (Student)
 */
const getLeaves = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const leaves = await LeaveRequest.find({ student: student._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Student Leaves API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching leave requests.' });
  }
};

/**
 * @route   POST /api/student/leaves
 * @desc    Submit new leave application
 * @access  Private (Student)
 */
const applyLeave = async (req, res) => {
  try {
    const { reason, startDate, endDate, description } = req.body;

    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please provide leave reason, start date, and end date.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be prior to start date.' });
    }

    const leave = new LeaveRequest({
      student: student._id,
      studentName: student.name,
      reason: reason.trim(),
      startDate: start,
      endDate: end,
      description: description ? description.trim() : '',
      status: 'Pending'
    });

    await leave.save();

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Status: Pending.',
      data: leave
    });
  } catch (error) {
    console.error('Apply Leave API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting leave application.' });
  }
};

/**
 * @route   GET /api/student/profile
 * @desc    Get Student profile
 * @access  Private (Student)
 */
const getProfile = async (req, res) => {
  try {
    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        courseName: student.courseName || 'B.Tech Computer Science & Engineering',
        semester: student.semester || 4,
        phone: student.phone || '',
        guardianName: student.guardianName || '',
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error('Student Profile API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

/**
 * @route   PUT /api/student/profile
 * @desc    Update safe contact fields in Student profile
 * @access  Private (Student)
 */
const updateProfile = async (req, res) => {
  try {
    const { phone, guardianName } = req.body;

    const student = await resolveStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (phone !== undefined) student.phone = phone.trim();
    if (guardianName !== undefined) student.guardianName = guardianName.trim();

    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Profile contact details updated successfully.',
      data: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        courseName: student.courseName,
        semester: student.semester,
        phone: student.phone,
        guardianName: student.guardianName
      }
    });
  } catch (error) {
    console.error('Update Profile API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

module.exports = {
  getDashboard,
  getAttendance,
  getTimetable,
  getAssignments,
  submitAssignment,
  getResults,
  getStudyMaterials,
  getLeaves,
  applyLeave,
  getProfile,
  updateProfile
};
