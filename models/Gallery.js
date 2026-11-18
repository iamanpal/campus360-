const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Gallery item title is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Campus', 'Events', 'Sports', 'Facilities'],
    default: 'Campus'
  },
  imagePath: {
    type: String,
    required: [true, 'Image path or icon is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gallery', gallerySchema);
