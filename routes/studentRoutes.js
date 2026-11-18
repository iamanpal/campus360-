const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/studentController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Protect all Student routes with JWT Auth & 'student' Role Authorization
router.use(protect);
router.use(authorizeRoles('student'));

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.get('/timetable', getTimetable);
router.get('/assignments', getAssignments);
router.post('/assignments/:assignmentId/submit', submitAssignment);
router.get('/results', getResults);
router.get('/materials', getStudyMaterials);
router.get('/leaves', getLeaves);
router.post('/leaves', applyLeave);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
