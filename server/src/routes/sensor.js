// server/src/routes/sensor.js
const express = require('express');
const {
    addSensorData,
    getSensorData,
    getLatestSensorData,
    getSensorAnalytics,
    getMaintenanceAlerts,
    resolveAlert
} = require('../controllers/sensorController');

const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply protection and rate limiting to all routes
router.use(protect);
router.use(apiLimiter);

router.route('/data')
    .post(addSensorData)
    .get(getSensorData);

router.get('/latest', getLatestSensorData);
router.get('/analytics', getSensorAnalytics);

router.route('/alerts')
    .get(getMaintenanceAlerts);

router.put('/alerts/:id/resolve', resolveAlert);

module.exports = router;