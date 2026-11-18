const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Timetable = require('../models/Timetable');
const Notice = require('../models/Notice');
const Result = require('../models/Result');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const Gallery = require('../models/Gallery');
const Attendance = require('../models/Attendance');
const RegistrationRequest = require('../models/RegistrationRequest');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get Admin Dashboard system counts
 * @access  Private (Admin)
 */
const getDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
    const activeNotices = await Notice.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: 'Open' });

    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(4);
    const recentFaculty = await Faculty.find().sort({ createdAt: -1 }).limit(4);

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          totalStudents,
          totalFaculty,
          totalCourses,
          totalDepartments,
          pendingLeaves,
          activeNotices,
          openComplaints
        },
        recentStudents,
        recentFaculty
      }
    });
  } catch (error) {
    console.error('Admin Dashboard API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching admin summary.' });
  }
};

/* ==========================================================================
   STUDENT MANAGEMENT
   ========================================================================== */
const getStudents = async (req, res) => {
  try {
    // 1. Auto-sync: Ensure every User with role 'student' has a valid linked Student document
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

    // 2. Fetch all students populated with user account status
    const students = await Student.find().populate('user', 'name email role active').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('getStudents Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching students.' });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, courseName, semester, phone, guardianName } = req.body;
    if (!name || !email || !courseName) {
      return res.status(400).json({ success: false, message: 'Please provide student name, email, and degree course.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find or create User
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.name = name.trim();
      user.role = 'student';
      user.active = true;
      if (password && password.trim()) {
        user.password = password.trim();
      }
      await user.save();
    } else {
      if (!password || !password.trim()) {
        return res.status(400).json({ success: false, message: 'Login password is required to create a new student account.' });
      }
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        password: password.trim(),
        role: 'student',
        active: true
      });
      await user.save();
    }

    // 2. Find or create Student profile
    let student = await Student.findOne({
      $or: [{ user: user._id }, { email: cleanEmail }]
    });

    const studentId = `STU${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    if (student) {
      student.user = user._id;
      student.name = name.trim();
      student.email = cleanEmail;
      student.courseName = courseName.trim();
      if (semester) student.semester = Number(semester);
      if (phone) student.phone = phone.trim();
      if (guardianName) student.guardianName = guardianName.trim();
      await student.save();
    } else {
      student = new Student({
        user: user._id,
        studentId,
        name: name.trim(),
        email: cleanEmail,
        courseName: courseName.trim(),
        semester: semester ? Number(semester) : 1,
        phone: phone ? phone.trim() : '',
        guardianName: guardianName ? guardianName.trim() : ''
      });

      try {
        await student.save();
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          student.studentId = `STU${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
          await student.save();
        } else {
          throw saveErr;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Student account ${student.name} registered and connected successfully (Roll No: ${student.studentId}). Student can now log in.`,
      data: student
    });
  } catch (error) {
    console.error('Create Student API Error:', error);
    return res.status(500).json({ success: false, message: `Server error creating student account: ${error.message}` });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courseName, semester, phone, guardianName, active } = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (name) student.name = name.trim();
    if (courseName) student.courseName = courseName.trim();
    if (semester) student.semester = Number(semester);
    if (phone !== undefined) student.phone = phone.trim();
    if (guardianName !== undefined) student.guardianName = guardianName.trim();
    await student.save();

    if (active !== undefined && student.user) {
      await User.findByIdAndUpdate(student.user, { active });
    }

    return res.status(200).json({ success: true, message: 'Student details updated successfully.', data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating student details.' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    let newStatus = false;
    if (student.user) {
      const user = await User.findById(student.user);
      if (user) {
        newStatus = !user.active;
        user.active = newStatus;
        await user.save();
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Student account ${newStatus ? 'activated' : 'deactivated'} successfully.` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error toggling student account status.' });
  }
};

/* ==========================================================================
   FACULTY MANAGEMENT
   ========================================================================== */
const getFaculty = async (req, res) => {
  try {
    // 1. Auto-sync: Ensure every User with role 'faculty' has a valid linked Faculty document
    const facultyUsers = await User.find({ role: { $in: ['faculty', 'Faculty'] } });
    for (const u of facultyUsers) {
      const cleanEmail = (u.email || '').trim().toLowerCase();
      let fac = await Faculty.findOne({
        $or: [{ user: u._id }, { email: cleanEmail }]
      });
      if (!fac) {
        const facId = `FAC${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
        fac = new Faculty({
          user: u._id,
          facultyId: facId,
          name: u.name || 'Faculty Member',
          email: cleanEmail,
          departmentName: 'Computer Science',
          designation: 'Assistant Professor',
          assignedSubjects: ['Software Engineering', 'Computer Networks', 'Operating Systems', 'Data Structures']
        });
        try {
          await fac.save();
        } catch (facErr) {
          if (facErr.code === 11000) {
            fac.facultyId = `FAC${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
            await fac.save().catch(() => {});
          }
        }
      } else if (!fac.user || String(fac.user) !== String(u._id)) {
        fac.user = u._id;
        if (!fac.name && u.name) fac.name = u.name;
        if (!fac.email) fac.email = cleanEmail;
        await fac.save().catch(() => {});
      }
    }

    const faculty = await Faculty.find().populate('user', 'name email role active').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    console.error('getFaculty Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching faculty list.' });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email, password, departmentName, designation, assignedSubjects, phone } = req.body;
    if (!name || !email || !departmentName) {
      return res.status(400).json({ success: false, message: 'Please provide faculty name, email, and department.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find or create User
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.name = name.trim();
      user.role = 'faculty';
      user.active = true;
      if (password && password.trim()) {
        user.password = password.trim();
      }
      await user.save();
    } else {
      if (!password || !password.trim()) {
        return res.status(400).json({ success: false, message: 'Login password is required to create a new faculty account.' });
      }
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        password: password.trim(),
        role: 'faculty',
        active: true
      });
      await user.save();
    }

    // 2. Find or create Faculty profile
    let faculty = await Faculty.findOne({
      $or: [{ user: user._id }, { email: cleanEmail }]
    });

    const subjectsArray = typeof assignedSubjects === 'string'
      ? assignedSubjects.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(assignedSubjects) ? assignedSubjects : ['Software Engineering', 'Computer Networks', 'Operating Systems']);

    const facultyId = `FAC${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    if (faculty) {
      faculty.user = user._id;
      faculty.name = name.trim();
      faculty.email = cleanEmail;
      faculty.departmentName = departmentName.trim();
      if (designation) faculty.designation = designation.trim();
      if (subjectsArray.length > 0) faculty.assignedSubjects = subjectsArray;
      if (phone) faculty.phone = phone.trim();
      await faculty.save();
    } else {
      faculty = new Faculty({
        user: user._id,
        facultyId,
        name: name.trim(),
        email: cleanEmail,
        departmentName: departmentName.trim(),
        designation: designation ? designation.trim() : 'Assistant Professor',
        assignedSubjects: subjectsArray,
        phone: phone ? phone.trim() : ''
      });

      try {
        await faculty.save();
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          faculty.facultyId = `FAC${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
          await faculty.save();
        } else {
          throw saveErr;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Faculty account ${faculty.name} registered and connected successfully (Staff ID: ${faculty.facultyId}). Faculty can now log in.`,
      data: faculty
    });
  } catch (error) {
    console.error('Create Faculty API Error:', error);
    return res.status(500).json({ success: false, message: `Server error creating faculty account: ${error.message}` });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentName, designation, assignedSubjects, phone, active } = req.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty member not found.' });

    if (name) faculty.name = name.trim();
    if (departmentName) faculty.departmentName = departmentName.trim();
    if (designation) faculty.designation = designation.trim();
    if (phone !== undefined) faculty.phone = phone.trim();

    if (assignedSubjects !== undefined) {
      faculty.assignedSubjects = typeof assignedSubjects === 'string'
        ? assignedSubjects.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(assignedSubjects) ? assignedSubjects : []);
    }

    await faculty.save();

    if (active !== undefined && faculty.user) {
      await User.findByIdAndUpdate(faculty.user, { active });
    }

    return res.status(200).json({ success: true, message: 'Faculty details updated successfully.', data: faculty });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating faculty details.' });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty member not found.' });

    let newStatus = false;
    if (faculty.user) {
      const user = await User.findById(faculty.user);
      if (user) {
        newStatus = !user.active;
        user.active = newStatus;
        await user.save();
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Faculty account ${newStatus ? 'activated' : 'deactivated'} successfully.` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error toggling faculty account status.' });
  }
};

/* ==========================================================================
   COURSE & DEPARTMENT MANAGEMENT
   ========================================================================== */
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching courses.' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { name, department, duration, seats, description, subjects } = req.body;
    if (!name || !department || !duration || !description) {
      return res.status(400).json({ success: false, message: 'Please provide course name, department, duration, and description.' });
    }

    const subjectsArray = typeof subjects === 'string'
      ? subjects.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(subjects) ? subjects : []);

    const course = new Course({
      name: name.trim(),
      department: department.trim(),
      duration: duration.trim(),
      seats: seats ? Number(seats) : 60,
      description: description.trim(),
      subjects: subjectsArray
    });

    await course.save();

    return res.status(201).json({ success: true, message: 'Course created and published to public site.', data: course });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating course.' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, duration, seats, description, subjects } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    if (name) course.name = name.trim();
    if (department) course.department = department.trim();
    if (duration) course.duration = duration.trim();
    if (seats) course.seats = Number(seats);
    if (description) course.description = description.trim();
    if (subjects !== undefined) {
      course.subjects = typeof subjects === 'string'
        ? subjects.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(subjects) ? subjects : []);
    }

    await course.save();

    return res.status(200).json({ success: true, message: 'Course updated successfully.', data: course });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating course.' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting course.' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return res.status(200).json({ success: true, data: departments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching departments.' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code, description, headOfDepartment } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Please provide department name and code.' });
    }

    const dept = new Department({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      headOfDepartment: headOfDepartment ? headOfDepartment.trim() : ''
    });

    await dept.save();

    return res.status(201).json({ success: true, message: 'Department created successfully.', data: dept });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating department.' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, headOfDepartment } = req.body;

    const dept = await Department.findById(id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });

    if (name) dept.name = name.trim();
    if (code) dept.code = code.trim().toUpperCase();
    if (description !== undefined) dept.description = description.trim();
    if (headOfDepartment !== undefined) dept.headOfDepartment = headOfDepartment.trim();

    await dept.save();

    return res.status(200).json({ success: true, message: 'Department updated successfully.', data: dept });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating department.' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting department.' });
  }
};

/* ==========================================================================
   TIMETABLE & NOTICES MANAGEMENT
   ========================================================================== */
const getTimetables = async (req, res) => {
  try {
    const timetable = await Timetable.find().sort({ semester: 1, startTime: 1 });
    return res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching master timetable.' });
  }
};

const createTimetable = async (req, res) => {
  try {
    const { courseName, semester, day, startTime, endTime, subject, facultyName, room } = req.body;
    if (!semester || !day || !startTime || !endTime || !subject || !room) {
      return res.status(400).json({ success: false, message: 'Please provide all required timetable fields.' });
    }

    const slot = new Timetable({
      courseName: courseName ? courseName.trim() : 'B.Tech Computer Science',
      semester: Number(semester),
      day,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      subject: subject.trim(),
      facultyName: facultyName ? facultyName.trim() : 'Faculty',
      room: room.trim()
    });

    await slot.save();

    return res.status(201).json({ success: true, message: 'Timetable slot created and published to Student & Faculty portals.', data: slot });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating timetable slot.' });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await Timetable.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Timetable slot deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting timetable slot.' });
  }
};

const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ publishedDate: -1, createdAt: -1 });
    return res.status(200).json({ success: true, data: notices });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching notices.' });
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, category, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide notice title and content.' });
    }

    const notice = new Notice({
      title: title.trim(),
      category: category || 'General',
      content: content.trim(),
      publishedDate: new Date()
    });

    await notice.save();

    return res.status(201).json({ success: true, message: 'Notice published campus-wide successfully.', data: notice });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating notice.' });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    await Notice.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Notice deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting notice.' });
  }
};

/* ==========================================================================
   RESULTS, LEAVES, COMPLAINTS & GALLERY MANAGEMENT
   ========================================================================== */
const getResults = async (req, res) => {
  try {
    const results = await Result.find().populate('student', 'name studentId email').sort({ semester: 1 });
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching exam results.' });
  }
};

const getLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('student', 'name studentId email').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching leave requests.' });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be set to Approved or Rejected.' });
    }

    const leave = await LeaveRequest.findByIdAndUpdate(id, { status }, { new: true });
    return res.status(200).json({ success: true, message: `Leave application status updated to '${status}'.`, data: leave });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating leave status.' });
  }
};

const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching complaints.' });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Open, In Progress, or Resolved.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(id, { status }, { new: true });
    return res.status(200).json({ success: true, message: `Complaint status updated to '${status}'.`, data: complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating complaint status.' });
  }
};

const getGallery = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching gallery items.' });
  }
};

const createGalleryItem = async (req, res) => {
  try {
    const { title, category, imagePath, description } = req.body;
    if (!title || !imagePath) {
      return res.status(400).json({ success: false, message: 'Please provide gallery title and image path/icon.' });
    }

    const item = new Gallery({
      title: title.trim(),
      category: category || 'Campus',
      imagePath: imagePath.trim(),
      description: description ? description.trim() : ''
    });

    await item.save();

    return res.status(201).json({ success: true, message: 'Gallery photo added and published to Public Campus page.', data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error adding gallery photo.' });
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Gallery.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Gallery item deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting gallery item.' });
  }
};

/* ==========================================================================
   REPORTS & SETTINGS
   ========================================================================== */
const getReports = async (req, res) => {
  try {
    const students = await Student.find();
    const faculty = await Faculty.find();
    const courses = await Course.find();
    const leaves = await LeaveRequest.find();

    // Aggregations
    const courseDistribution = {};
    students.forEach(st => {
      const c = st.courseName || 'Unassigned';
      courseDistribution[c] = (courseDistribution[c] || 0) + 1;
    });

    const deptDistribution = {};
    faculty.forEach(f => {
      const d = f.departmentName || 'General';
      deptDistribution[d] = (deptDistribution[d] || 0) + 1;
    });

    const leaveStatusBreakdown = {
      Pending: leaves.filter(l => l.status === 'Pending').length,
      Approved: leaves.filter(l => l.status === 'Approved').length,
      Rejected: leaves.filter(l => l.status === 'Rejected').length
    };

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalCourses: courses.length,
        courseDistribution,
        deptDistribution,
        leaveStatusBreakdown
      }
    });
  } catch (error) {
    console.error('Admin Reports API Error:', error);
    return res.status(500).json({ success: false, message: 'Error compiling institutional reports.' });
  }
};

const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching admin settings.' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (password && password.trim().length > 0) {
      user.password = password.trim();
    }

    await user.save();

    return res.status(200).json({ success: true, message: 'Admin account settings updated successfully.' });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating admin settings.' });
  }
};

/* ==========================================================================
   STUDENT REGISTRATION REQUESTS MANAGEMENT
   ========================================================================== */
const getRegistrations = async (req, res) => {
  try {
    const requests = await RegistrationRequest.find().sort({ requestedAt: -1 });
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('getRegistrations Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching registration requests.' });
  }
};

const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const regReq = await RegistrationRequest.findById(id);
    if (!regReq) {
      return res.status(404).json({ success: false, message: 'Registration request not found.' });
    }

    if (regReq.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Registration request is already approved.' });
    }

    const cleanEmail = regReq.email.toLowerCase().trim();

    // 1. Create or activate User
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = new User({
        name: regReq.name.trim(),
        email: cleanEmail,
        password: regReq.password,
        role: 'student',
        active: true
      });
      await user.save();
    } else {
      user.name = regReq.name.trim();
      user.password = regReq.password;
      user.role = 'student';
      user.active = true;
      await user.save();
    }

    // 2. Create or update Student profile
    let student = await Student.findOne({
      $or: [{ user: user._id }, { email: cleanEmail }]
    });

    const roll = `STU${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    if (student) {
      student.user = user._id;
      student.name = regReq.name.trim();
      student.email = cleanEmail;
      if (regReq.courseName) student.courseName = regReq.courseName.trim();
      if (regReq.semester) student.semester = Number(regReq.semester);
      if (regReq.phone) student.phone = regReq.phone.trim();
      await student.save();
    } else {
      student = new Student({
        user: user._id,
        studentId: roll,
        name: regReq.name.trim(),
        email: cleanEmail,
        courseName: regReq.courseName || 'B.Tech Computer Science & Engineering',
        semester: regReq.semester || 1,
        phone: regReq.phone || ''
      });

      try {
        await student.save();
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          student.studentId = `STU${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
          await student.save();
        } else {
          throw saveErr;
        }
      }
    }

    // 3. Mark request as Approved
    regReq.status = 'Approved';
    regReq.reviewedAt = new Date();
    regReq.reviewedBy = req.user ? req.user._id : null;
    await regReq.save();

    return res.status(200).json({
      success: true,
      message: `Registration request for ${regReq.name} APPROVED! Student Roll No: ${student.studentId}.`,
      data: {
        studentId: student.studentId,
        email: student.email,
        name: student.name
      }
    });
  } catch (error) {
    console.error('approveRegistration Error:', error);
    return res.status(500).json({ success: false, message: `Error approving registration: ${error.message}` });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const regReq = await RegistrationRequest.findById(id);
    if (!regReq) {
      return res.status(404).json({ success: false, message: 'Registration request not found.' });
    }

    regReq.status = 'Rejected';
    regReq.reviewedAt = new Date();
    regReq.reviewedBy = req.user ? req.user._id : null;
    await regReq.save();

    // If an inactive user was created before, deactivate it
    const user = await User.findOne({ email: regReq.email.toLowerCase().trim() });
    if (user && user.role === 'student') {
      user.active = false;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: `Registration request for ${regReq.name} has been REJECTED.`
    });
  } catch (error) {
    console.error('rejectRegistration Error:', error);
    return res.status(500).json({ success: false, message: 'Error rejecting registration.' });
  }
};

module.exports = {
  getDashboard,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTimetables,
  createTimetable,
  deleteTimetable,
  getNotices,
  createNotice,
  deleteNotice,
  getResults,
  getLeaves,
  updateLeaveStatus,
  getComplaints,
  updateComplaintStatus,
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
  getReports,
  getSettings,
  updateSettings,
  getRegistrations,
  approveRegistration,
  rejectRegistration
};
