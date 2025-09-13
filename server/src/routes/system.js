const express = require('express');
const { body } = require('express-validator');
const {
  getSystemSettings,
  updateSystemSettings,
  updateDataRetention,
  updateBackupSettings,
  updateAlertSettings,
  updateEmailSettings,
  testEmailSettings,
  updateMaintenanceSettings,
  getSystemStats,
  createBackup,
  getBackups,
  clearSystemLogs,
  getSystemHealth,
  restartServices
} = require('../controllers/systemController');

const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminAuth);

// System settings routes
router.route('/settings')
  .get(getSystemSettings)
  .put(updateSystemSettings);

// Specific settings routes
router.put('/settings/data-retention', [
  body('sensorData')
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage('Sensor data retention must be between 1 and 3650 days'),
  body('alerts')
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage('Alerts retention must be between 1 and 3650 days'),
  body('logs')
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage('Logs retention must be between 1 and 3650 days')
], updateDataRetention);

router.put('/settings/backup', [
  body('autoBackup')
    .optional()
    .isBoolean()
    .withMessage('Auto backup must be a boolean'),
  body('backupFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid backup frequency'),
  body('backupTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid backup time format (HH:MM)'),
  body('backupRetention')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Backup retention must be between 1 and 365 days')
], updateBackupSettings);

router.put('/settings/alerts', [
  body('globalDelay')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Global delay must be between 0 and 60 minutes'),
  body('maxConcurrentAlerts')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max concurrent alerts must be between 1 and 100'),
  body('enabledTypes')
    .optional()
    .isObject()
    .withMessage('Enabled types must be an object')
], updateAlertSettings);

router.put('/settings/email', [
  body('smtpHost')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('SMTP host must be between 1 and 255 characters'),
  body('smtpPort')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('SMTP port must be between 1 and 65535'),
  body('smtpSecure')
    .optional()
    .isBoolean()
    .withMessage('SMTP secure must be a boolean'),
  body('smtpUser')
    .optional()
    .isEmail()
    .withMessage('SMTP user must be a valid email'),
  body('fromEmail')
    .optional()
    .isEmail()
    .withMessage('From email must be a valid email'),
  body('fromName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('From name must be between 1 and 100 characters')
], updateEmailSettings);

router.post('/settings/email/test', [
  body('testEmail')
    .isEmail()
    .withMessage('Test email must be a valid email address')
], testEmailSettings);

router.put('/settings/maintenance', [
  body('window.start')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('window.end')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('window.timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be between 1 and 50 characters'),
  body('autoMaintenance')
    .optional()
    .isBoolean()
    .withMessage('Auto maintenance must be a boolean')
], updateMaintenanceSettings);

// System operations routes
router.get('/stats', getSystemStats);
router.get('/health', getSystemHealth);

router.post('/backup', createBackup);
router.get('/backups', getBackups);

router.post('/logs/clear', clearSystemLogs);
router.post('/services/restart', restartServices);

module.exports = router;