const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const StudyMaterial = require('../models/StudyMaterial');
const LeaveRequest = require('../models/LeaveRequest');
const Notice = require('../models/Notice');

/**
 * Helper: Resolve Faculty document associated with authenticated User
 * Handles email-matching, auto-linking, guaranteed unique faculty ID, and safe fallback.
 */
async function resolveFaculty(userId) {
  try {
    let faculty = await Faculty.findOne({ user: userId });
    if (faculty) return faculty;

    const user = await User.findById(userId);
    if (!user) return null;

    const cleanEmail = (user.email || '').trim().toLowerCase();

    // Check if faculty exists by email
    faculty = await Faculty.findOne({ email: cleanEmail });
    if (faculty) {
      faculty.user = user._id;
      if (!faculty.name && user.name) faculty.name = user.name;
      if (!faculty.email) faculty.email = cleanEmail;
      await faculty.save().catch(() => {});
      return faculty;
    }

    const uniqueId = `FAC${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    faculty = new Faculty({
      user: user._id,
      facultyId: uniqueId,
      name: user.name || 'Faculty Member',
      email: cleanEmail,
      departmentName: 'Computer Science',
      designation: 'Assistant Professor',
      assignedSubjects: [
        'Software Engineering',
        'Computer Networks',
        'Economics for Engineers',
        'Design Analysis and Algorithms',
        'Operating Systems',
        'Compiler Design',
        'Data Structures',
        'Database Systems',
        'Web Development',
        'AI & ML'
      ]
    });

    try {
      await faculty.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        const existing = await Faculty.findOne({
          $or: [{ user: user._id }, { email: cleanEmail }]
        });
        if (existing) {
          existing.user = user._id;
          await existing.save().catch(() => {});
          return existing;
        }
        faculty.facultyId = `FAC${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
        await faculty.save();
      } else {
        throw saveErr;
      }
    }

    return faculty;
  } catch (err) {
    console.error('resolveFaculty Error:', err);
    try {
      const user = await User.findById(userId);
      if (user) {
        const fallback = await Faculty.findOne({ email: (user.email || '').trim().toLowerCase() });
        if (fallback) return fallback;
      }
    } catch (e) {}
    return null;
  }
}

/**
 * @route   GET /api/faculty/dashboard
 * @desc    Get Faculty Dashboard summary metrics
 * @access  Private (Faculty)
 */
const getDashboard = async (req, res) => {
  try {
    const faculty = await resolveFaculty(req.user._id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const assignedSubjects = (faculty.assignedSubjects && faculty.assignedSubjects.length > 0)
      ? faculty.assignedSubjects
      : ['Software Engineering', 'Computer Networks', 'Economics for Engineers', 'Design Analysis and Algorithms', 'Operating Systems', 'Compiler Design'];
    const totalStudents = await Student.countDocuments();
    
    const myAssignments = await Assignment.find({ 
      $or: [{ faculty: faculty._id }, { subject: { $in: assignedSubjects } }]
    });

    const myAssignmentIds = myAssignments.map(a => a._id);
    const pendingSubmissionsCount = await Submission.countDocuments({
      assignment: { $in: myAssignmentIds },
      marksObtained: null
    });

    const pendingLeavesCount = await LeaveRequest.countDocuments({ status: 'Pending' });
    const recentNotices = await Notice.find().sort({ publishedDate: -1, createdAt: -1 }).limit(3);

    return res.status(200).json({
      success: true,
      data: {
        faculty: {
          id: faculty.facultyId,
          name: faculty.name,
          email: faculty.email,
          department: faculty.departmentName || 'Computer Science',
          designation: faculty.designation || 'Assistant Professor'
        },
        metrics: {
          assignedClassesCount: assignedSubjects.length,
          totalStudentsCount: totalStudents,
          pendingSubmissionsCount,
          pendingLeavesCount
        },
        assignedSubjects,
        recentNotices
      }
    });
  } catch (error) {
    console.error('Faculty Dashboard API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching faculty dashboard summary.' });
  }
};

/**
 * @route   GET /api/faculty/classes
 * @desc    Get Faculty assigned classes & timetable schedule
 * @access  Private (Faculty)
 */
const getClasses = async (req, res) => {
  try {
    const faculty = await resolveFaculty(req.user._id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const assignedSubjects = faculty.assignedSubjects || [];
    const schedule = await Timetable.find({
      $or: [
        { facultyName: faculty.name },
        { subject: { $in: assignedSubjects } }
      ]
    }).sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      data: {
        assignedSubjects,
        schedule
      }
    });
  } catch (error) {
    console.error('Faculty Classes API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assigned classes.' });
  }
};

/**
 * @route   GET /api/faculty/attendance/students
 * @desc    Get list of enrolled students for marking attendance
 * @access  Private (Faculty)
 */
const getStudentsForAttendance = async (req, res) => {
  try {
    // Auto-sync: Ensure any User with role 'student' has an active Student profile
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

    const students = await Student.find().sort({ name: 1, studentId: 1 });
    return res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get Students for Attendance API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching student list.' });
  }
};

/**
 * @route   POST /api/faculty/attendance
 * @desc    Mark attendance for enrolled students on a specific date
 * @access  Private (Faculty)
 */
const markAttendance = async (req, res) => {
  try {
    const { subject, date, records } = req.body;
    const faculty = await resolveFaculty(req.user._id);

    if (!subject || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select a subject and provide student attendance records.' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const item of records) {
      const studentId = item.studentId;
      const status = item.status || 'Present';

      let existing = await Attendance.findOne({
        student: studentId,
        subject: subject.trim(),
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 86400000)
        }
      });

      if (existing) {
        existing.status = status;
        existing.faculty = faculty ? faculty._id : existing.faculty;
        await existing.save();
        savedRecords.push(existing);
      } else {
        const newRecord = new Attendance({
          student: studentId,
          subject: subject.trim(),
          faculty: faculty ? faculty._id : null,
          date: attendanceDate,
          status
        });
        await newRecord.save();
        savedRecords.push(newRecord);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${savedRecords.length} students.`,
      data: savedRecords
    });
  } catch (error) {
    console.error('Mark Attendance API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error marking attendance.' });
  }
};

/**
 * @route   PUT /api/faculty/attendance/:id
 * @desc    Update single student attendance record
 * @access  Private (Faculty)
 */
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    if (status) record.status = status;
    await record.save();

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: record
    });
  } catch (error) {
    console.error('Update Attendance API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating attendance.' });
  }
};

/**
 * @route   GET /api/faculty/assignments
 * @desc    Get assignments created by faculty
 * @access  Private (Faculty)
 */
const getAssignments = async (req, res) => {
  try {
    const faculty = await resolveFaculty(req.user._id);
    const assignments = await Assignment.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Faculty Get Assignments API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assignments.' });
  }
};

/**
 * @route   POST /api/faculty/assignments
 * @desc    Create new assignment
 * @access  Private (Faculty)
 */
const createAssignment = async (req, res) => {
  try {
    const { title, subject, description, dueDate, totalMarks, imageUrl } = req.body;
    const faculty = await resolveFaculty(req.user._id);

    if (!title || !subject || !description || !dueDate) {
      return res.status(400).json({ success: false, message: 'Please provide title, subject, description, and due date.' });
    }

    const assignment = new Assignment({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      faculty: faculty ? faculty._id : null,
      facultyName: faculty ? faculty.name : req.user.name,
      dueDate: new Date(dueDate),
      totalMarks: totalMarks ? Number(totalMarks) : 100,
      imageUrl: imageUrl ? imageUrl.trim() : ''
    });

    await assignment.save();

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully and published to Student Portal.',
      data: assignment
    });
  } catch (error) {
    console.error('Create Assignment API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating assignment.' });
  }
};

/**
 * @route   PUT /api/faculty/assignments/:id
 * @desc    Update assignment details
 * @access  Private (Faculty)
 */
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, description, dueDate, totalMarks, imageUrl } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (title) assignment.title = title.trim();
    if (subject) assignment.subject = subject.trim();
    if (description) assignment.description = description.trim();
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (totalMarks) assignment.totalMarks = Number(totalMarks);
    if (imageUrl !== undefined) assignment.imageUrl = imageUrl.trim();

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully.',
      data: assignment
    });
  } catch (error) {
    console.error('Update Assignment API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating assignment.' });
  }
};

/**
 * @route   DELETE /api/faculty/assignments/:id
 * @desc    Delete assignment
 * @access  Private (Faculty)
 */
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    await Submission.deleteMany({ assignment: id });

    return res.status(200).json({
      success: true,
      message: 'Assignment and related submissions deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Assignment API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting assignment.' });
  }
};

/**
 * @route   GET /api/faculty/submissions
 * @desc    Get student submissions for evaluation
 * @access  Private (Faculty)
 */
const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('assignment', 'title subject totalMarks dueDate imageUrl')
      .populate('student', 'name studentId email')
      .sort({ submissionDate: -1 });

    return res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Faculty Get Submissions API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching student submissions.' });
  }
};

/**
 * @route   PUT /api/faculty/submissions/:id/evaluate
 * @desc    Evaluate student submission with marks & feedback
 * @access  Private (Faculty)
 */
const evaluateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, feedback } = req.body;

    const submission = await Submission.findById(id).populate('assignment');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (marksObtained === undefined || marksObtained === null) {
      return res.status(400).json({ success: false, message: 'Please provide evaluated marks score.' });
    }

    const marksNum = Number(marksObtained);
    const maxMarks = submission.assignment ? submission.assignment.totalMarks : 100;

    if (marksNum < 0 || marksNum > maxMarks) {
      return res.status(400).json({ success: false, message: `Marks obtained must be between 0 and ${maxMarks}.` });
    }

    submission.marksObtained = marksNum;
    if (feedback !== undefined) submission.feedback = feedback.trim();
    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Submission evaluated successfully.',
      data: submission
    });
  } catch (error) {
    console.error('Evaluate Submission API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error evaluating submission.' });
  }
};

/**
 * @route   GET /api/faculty/results
 * @desc    Get student exam results list
 * @access  Private (Faculty)
 */
const getResults = async (req, res) => {
  try {
    const results = await Result.find().populate('student', 'name studentId email').sort({ semester: 1, subject: 1 });
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Faculty Get Results API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching results.' });
  }
};

/**
 * @route   POST /api/faculty/results
 * @desc    Enter student exam marks & grade
 * @access  Private (Faculty)
 */
const createResult = async (req, res) => {
  try {
    const { studentId, semester, subject, marksObtained, maxMarks, grade } = req.body;

    if (!studentId || !semester || !subject || marksObtained === undefined) {
      return res.status(400).json({ success: false, message: 'Please select a student, semester, subject, and enter marks.' });
    }

    const studentObj = await Student.findById(studentId);
    if (!studentObj) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const marksNum = Number(marksObtained);
    const maxNum = maxMarks ? Number(maxMarks) : 100;

    let calculatedGrade = grade ? grade.trim().toUpperCase() : 'A';
    if (!grade) {
      const pct = (marksNum / maxNum) * 100;
      if (pct >= 90) calculatedGrade = 'A+';
      else if (pct >= 80) calculatedGrade = 'A';
      else if (pct >= 70) calculatedGrade = 'B+';
      else if (pct >= 60) calculatedGrade = 'B';
      else if (pct >= 50) calculatedGrade = 'C';
      else calculatedGrade = 'F';
    }

    let existing = await Result.findOne({
      student: studentId,
      semester: Number(semester),
      subject: subject.trim()
    });

    if (existing) {
      existing.marksObtained = marksNum;
      existing.maxMarks = maxNum;
      existing.grade = calculatedGrade;
      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Exam result updated successfully.',
        data: existing
      });
    }

    const newResult = new Result({
      student: studentId,
      semester: Number(semester),
      subject: subject.trim(),
      marksObtained: marksNum,
      maxMarks: maxNum,
      grade: calculatedGrade
    });

    await newResult.save();

    return res.status(201).json({
      success: true,
      message: 'Exam result entered successfully and synced with Student Portal.',
      data: newResult
    });
  } catch (error) {
    console.error('Create Result API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error entering exam result.' });
  }
};

/**
 * @route   GET /api/faculty/materials
 * @desc    Get study materials uploaded by faculty
 * @access  Private (Faculty)
 */
const getStudyMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find().sort({ uploadDate: -1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Faculty Get Materials API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching study materials.' });
  }
};

/**
 * @route   POST /api/faculty/materials
 * @desc    Upload/add study material
 * @access  Private (Faculty)
 */
const createStudyMaterial = async (req, res) => {
  try {
    const { title, subject, description, fileUrl } = req.body;
    const faculty = await resolveFaculty(req.user._id);

    if (!title || !subject || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Please provide title, subject, and material document URL.' });
    }

    const material = new StudyMaterial({
      title: title.trim(),
      subject: subject.trim(),
      description: description ? description.trim() : '',
      facultyName: faculty ? faculty.name : req.user.name,
      fileUrl: fileUrl.trim(),
      uploadDate: new Date()
    });

    await material.save();

    return res.status(201).json({
      success: true,
      message: 'Study material published successfully to Student Portal.',
      data: material
    });
  } catch (error) {
    console.error('Create StudyMaterial API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating study material.' });
  }
};

/**
 * @route   DELETE /api/faculty/materials/:id
 * @desc    Delete study material
 * @access  Private (Faculty)
 */
const deleteStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await StudyMaterial.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: 'Study material deleted successfully.'
    });
  } catch (error) {
    console.error('Delete StudyMaterial API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting study material.' });
  }
};

/**
 * @route   GET /api/faculty/leaves
 * @desc    Get student leave applications for review
 * @access  Private (Faculty)
 */
const getLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('student', 'name studentId email').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Faculty Get Leaves API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching leave requests.' });
  }
};

/**
 * @route   PUT /api/faculty/leaves/:id/status
 * @desc    Approve or Reject student leave application
 * @access  Private (Faculty)
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be set to Approved or Rejected.' });
    }

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({
      success: true,
      message: `Leave application status updated to '${status}'.`,
      data: leave
    });
  } catch (error) {
    console.error('Update Leave Status API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating leave status.' });
  }
};

/**
 * @route   GET /api/faculty/profile
 * @desc    Get Faculty profile details
 * @access  Private (Faculty)
 */
const getProfile = async (req, res) => {
  try {
    const faculty = await resolveFaculty(req.user._id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        facultyId: faculty.facultyId,
        name: faculty.name,
        email: faculty.email,
        departmentName: faculty.departmentName || 'Computer Science',
        designation: faculty.designation || 'Assistant Professor',
        assignedSubjects: faculty.assignedSubjects || [],
        phone: faculty.phone || ''
      }
    });
  } catch (error) {
    console.error('Faculty Profile API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching faculty profile.' });
  }
};

/**
 * @route   PUT /api/faculty/profile
 * @desc    Update safe contact/designation details for Faculty
 * @access  Private (Faculty)
 */
const updateProfile = async (req, res) => {
  try {
    const { phone, designation } = req.body;
    const faculty = await resolveFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    if (phone !== undefined) faculty.phone = phone.trim();
    if (designation !== undefined) faculty.designation = designation.trim();

    await faculty.save();

    return res.status(200).json({
      success: true,
      message: 'Faculty profile updated successfully.',
      data: {
        facultyId: faculty.facultyId,
        name: faculty.name,
        email: faculty.email,
        departmentName: faculty.departmentName,
        designation: faculty.designation,
        assignedSubjects: faculty.assignedSubjects,
        phone: faculty.phone
      }
    });
  } catch (error) {
    console.error('Faculty Update Profile API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

module.exports = {
  getDashboard,
  getClasses,
  getStudentsForAttendance,
  markAttendance,
  updateAttendance,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  evaluateSubmission,
  getResults,
  createResult,
  getStudyMaterials,
  createStudyMaterial,
  deleteStudyMaterial,
  getLeaves,
  updateLeaveStatus,
  getProfile,
  updateProfile
};
