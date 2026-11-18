const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');

/**
 * @route   GET /api/notices
 * @desc    Get all public notices from MongoDB
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ publishedDate: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices',
      data: []
    });
  }
});

module.exports = router;
