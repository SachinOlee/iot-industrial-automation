// server/src/routes/admin.js
const express = require('express');
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getSystemStats,
    getAllSensorData,
    getAllAlerts
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply protection, admin authorization, and rate limiting to all routes
router.use(protect);
router.use(authorize('admin'));
router.use(apiLimiter);

// User management routes
router.route('/users')
    .get(getUsers);

router.route('/users/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

// System statistics
router.get('/stats', getSystemStats);

// Data management routes
router.get('/sensor-data', getAllSensorData);
router.get('/alerts', getAllAlerts);

module.exports = router;