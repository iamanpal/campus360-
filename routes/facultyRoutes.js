const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/facultyController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Protect all Faculty routes with JWT Auth & 'faculty' Role Authorization
router.use(protect);
router.use(authorizeRoles('faculty'));

router.get('/dashboard', getDashboard);
router.get('/classes', getClasses);
router.get('/attendance/students', getStudentsForAttendance);
router.post('/attendance', markAttendance);
router.put('/attendance/:id', updateAttendance);
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.get('/submissions', getSubmissions);
router.put('/submissions/:id/evaluate', evaluateSubmission);
router.get('/results', getResults);
router.post('/results', createResult);
router.get('/materials', getStudyMaterials);
router.post('/materials', createStudyMaterial);
router.delete('/materials/:id', deleteStudyMaterial);
router.get('/leaves', getLeaves);
router.put('/leaves/:id/status', updateLeaveStatus);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
