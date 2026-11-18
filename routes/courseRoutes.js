const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

/**
 * @route   GET /api/courses
 * @desc    Get all available courses from MongoDB
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      data: []
    });
  }
});

module.exports = router;
