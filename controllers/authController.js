const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const RegistrationRequest = require('../models/RegistrationRequest');

/**
 * Generate JWT Token helper function
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'campus360_jwt_super_secret_key_2026',
    { expiresIn: '1d' }
  );
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get JWT token (supports Email OR Roll No / Faculty ID)
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate inputs
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or ID, password, and select your user role.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    // Find user by email OR by studentId (Roll No) OR by facultyId
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const student = await Student.findOne({ studentId: email.trim() });
      if (student && student.user) {
        user = await User.findById(student.user);
      } else if (student && student.email) {
        user = await User.findOne({ email: student.email.toLowerCase() });
      }

      if (!user) {
        const faculty = await Faculty.findOne({ facultyId: email.trim() });
        if (faculty && faculty.user) {
          user = await User.findById(faculty.user);
        } else if (faculty && faculty.email) {
          user = await User.findOne({ email: faculty.email.toLowerCase() });
        }
      }
    }

    if (!user) {
      // Check if there is a pending or rejected student registration request
      const pendingReg = await RegistrationRequest.findOne({ email: normalizedEmail });
      if (pendingReg) {
        if (pendingReg.status === 'Pending') {
          return res.status(403).json({
            success: false,
            message: '⏳ Your registration request is currently PENDING Admin approval. You will be able to log in once accepted by the College Administration.'
          });
        } else if (pendingReg.status === 'Rejected') {
          return res.status(403).json({
            success: false,
            message: '❌ Your student registration request was REJECTED by college administration. Please contact the administrator or re-apply.'
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email/ID or password.'
      });
    }

    // Verify user account is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Your account is currently inactive. Please contact system administration.'
      });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/ID or password.'
      });
    }

    // Verify role match (case-insensitive)
    if (user.role.toLowerCase() !== normalizedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch: This account is registered as '${user.role}', not '${role}'. Please select the correct login tab.`
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication processing.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Private (Protected by authMiddleware)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    console.error('getMe Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.'
    });
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Self-register a new Student account & auto-link profile
 * @access  Public
 */
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, courseName, semester, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email address, and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if an active User already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Check if there is already a registration request
    let regRequest = await RegistrationRequest.findOne({ email: cleanEmail });

    if (regRequest && regRequest.status === 'Pending') {
      return res.status(400).json({
        success: false,
        message: '⏳ A registration request for this email is already pending Admin approval. Please wait for the administrator to accept your account.'
      });
    }

    if (regRequest) {
      // Re-apply if previously rejected or approved
      regRequest.name = name.trim();
      regRequest.password = password;
      regRequest.courseName = courseName ? courseName.trim() : 'B.Tech Computer Science & Engineering';
      regRequest.semester = semester ? Number(semester) : 1;
      regRequest.phone = phone ? phone.trim() : '';
      regRequest.status = 'Pending';
      regRequest.requestedAt = new Date();
      await regRequest.save();
    } else {
      regRequest = new RegistrationRequest({
        name: name.trim(),
        email: cleanEmail,
        password,
        courseName: courseName ? courseName.trim() : 'B.Tech Computer Science & Engineering',
        semester: semester ? Number(semester) : 1,
        phone: phone ? phone.trim() : '',
        status: 'Pending'
      });
      await regRequest.save();
    }

    return res.status(201).json({
      success: true,
      message: '✅ Registration request submitted successfully! Your account will be activated once accepted by the College Administration.',
      status: 'Pending'
    });
  } catch (error) {
    console.error('Registration Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: `Server error during student registration: ${error.message}`
    });
  }
};

module.exports = {
  loginUser,
  getMe,
  registerStudent
};
