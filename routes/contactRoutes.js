const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

/**
 * @route   POST /api/contact
 * @desc    Submit a new contact form message to MongoDB
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic server-side validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Name, Email, Subject, and Message.'
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Create & save contact record in MongoDB
    const newContact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim()
    });

    await newContact.save();

    return res.status(201).json({
      success: true,
      message: `Thank you, ${name}! Your contact inquiry has been received successfully.`,
      data: newContact
    });
  } catch (error) {
    console.error('Error saving contact submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting your message. Please try again later.'
    });
  }
});

module.exports = router;
