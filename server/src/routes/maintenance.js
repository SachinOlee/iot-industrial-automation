// server/src/routes/maintenance.js
const express = require('express');
const router = express.Router();
const {
    getMaintenanceAlerts,
    getMaintenanceAlert,
    createMaintenanceAlert,
    updateMaintenanceAlert,
    resolveMaintenanceAlert,
    deleteMaintenanceAlert
} = require('../controllers/maintenanceController');

const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/maintenance - Get all maintenance alerts
router.get('/', getMaintenanceAlerts);

// GET /api/maintenance/:id - Get maintenance alert by ID
router.get('/:id', getMaintenanceAlert);

// POST /api/maintenance - Create new maintenance alert
router.post('/', createMaintenanceAlert);

// PUT /api/maintenance/:id - Update maintenance alert
router.put('/:id', updateMaintenanceAlert);

// PATCH /api/maintenance/:id/resolve - Resolve maintenance alert
router.patch('/:id/resolve', resolveMaintenanceAlert);

// DELETE /api/maintenance/:id - Delete maintenance alert
router.delete('/:id', deleteMaintenanceAlert);

module.exports = router;