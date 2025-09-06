const express = require('express');
const {
    register,
    verifyEmail,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updatePassword,
    logout,
    resendEmailVerification
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', authLimiter, resetPassword);
router.post('/resend-verification', authLimiter, resendEmailVerification);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);

// Email verification (public)
router.get('/verify-email/:token', verifyEmail);

module.exports = router;