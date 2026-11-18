const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

/**
 * @route   GET /api/gallery
 * @desc    Get all gallery items from MongoDB
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const galleryItems = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: galleryItems.length,
      data: galleryItems
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching gallery items',
      data: []
    });
  }
});

module.exports = router;
