const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Protect all Admin routes with JWT Auth & 'admin' Role Authorization
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboard);

router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Student Self-Registration Requests & Approval Workflow
router.get('/registrations', getRegistrations);
router.put('/registrations/:id/approve', approveRegistration);
router.put('/registrations/:id/reject', rejectRegistration);

router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

router.get('/timetable', getTimetables);
router.post('/timetable', createTimetable);
router.delete('/timetable/:id', deleteTimetable);

router.get('/notices', getNotices);
router.post('/notices', createNotice);
router.delete('/notices/:id', deleteNotice);

router.get('/results', getResults);

router.get('/leaves', getLeaves);
router.put('/leaves/:id/status', updateLeaveStatus);

router.get('/complaints', getComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);

router.get('/gallery', getGallery);
router.post('/gallery', createGalleryItem);
router.delete('/gallery/:id', deleteGalleryItem);

router.get('/reports', getReports);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
