const express = require('express');
const { body } = require('express-validator');
const {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachineStats,
  updateMachineThresholds,
  getMaintenanceDue,
  bulkUpdateMachines
} = require('../controllers/machineController');

const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminAuth);

// Validation rules
const machineValidation = [
  body('machineId')
    .isLength({ min: 1, max: 50 })
    .withMessage('Machine ID must be between 1 and 50 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Machine ID can only contain uppercase letters, numbers, hyphens, and underscores'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Machine name must be between 1 and 100 characters'),
  body('location')
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  body('type')
    .isIn(['CNC Machine', 'Industrial Robot', 'Conveyor System', 'Packaging Machine', 'Quality Control', 'Other'])
    .withMessage('Invalid machine type')
];

const thresholdsValidation = [
  body('thresholds.temperature.warning')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Temperature warning threshold must be between 0 and 200'),
  body('thresholds.temperature.critical')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Temperature critical threshold must be between 0 and 200'),
  body('thresholds.voltage.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Voltage minimum must be positive'),
  body('thresholds.voltage.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Voltage maximum must be positive'),
  body('thresholds.motorSpeed.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Motor speed maximum must be positive')
];

// Routes
router.route('/')
  .get(getMachines)
  .post(machineValidation, createMachine);

router.route('/:id')
  .get(getMachine)
  .put(machineValidation, updateMachine)
  .delete(deleteMachine);

router.route('/:id/thresholds')
  .put(thresholdsValidation, updateMachineThresholds);

// Statistics and maintenance routes
router.get('/stats/overview', getMachineStats);
router.get('/maintenance/due', getMaintenanceDue);

// Bulk operations
router.put('/bulk/update', [
  body('machineIds')
    .isArray({ min: 1 })
    .withMessage('Machine IDs must be a non-empty array'),
  body('machineIds.*')
    .isMongoId()
    .withMessage('Invalid machine ID format'),
  body('updates')
    .isObject()
    .withMessage('Updates must be an object')
], bulkUpdateMachines);

module.exports = router;