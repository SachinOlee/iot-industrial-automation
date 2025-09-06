// server/src/controllers/authController.js
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        // Generate email verification token
        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Create verification URL
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

        // Send verification email
        const message = `
            <h1>Welcome to IoT Industrial Automation!</h1>
            <p>Hello ${firstName},</p>
            <p>Thank you for registering. Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link: ${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Email Verification - IoT Industrial Automation',
                html: message
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please check your email to verify your account.',
                data: {
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            
            // If email fails, delete user
            await User.findByIdAndDelete(user._id);
            
            return res.status(500).json({
                success: false,
                message: 'User registration failed. Could not send verification email.'
            });
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        // Get hashed token
        const emailVerificationToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken,
            isEmailVerified: false
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Update user verification status
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated. Please contact administrator.'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>Hello ${user.firstName},</p>
            <p>You have requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link: ${resetUrl}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset - IoT Industrial Automation',
                html: message
            });

            res.json({
                success: true,
                message: 'Password reset email sent'
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset'
        });
    }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        if (!(await user.matchPassword(req.body.currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = req.body.newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password update'
        });
    }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.json({
        success: true,
        message: 'User logged out successfully'
    });
};

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
const resendEmailVerification = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Create verification URL
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

        // Send verification email
        const message = `
            <h1>Email Verification - IoT Industrial Automation</h1>
            <p>Hello ${user.firstName},</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link: ${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Email Verification - IoT Industrial Automation',
                html: message
            });

            res.json({
                success: true,
                message: 'Verification email sent successfully'
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Email could not be sent'
            });
        }

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
        options.sameSite = 'strict';
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    lastLogin: user.lastLogin
                }
            }
        });
};

module.exports = {
    register,
    verifyEmail,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updatePassword,
    logout,
    resendEmailVerification
};