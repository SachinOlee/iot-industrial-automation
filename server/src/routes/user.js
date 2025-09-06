const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;