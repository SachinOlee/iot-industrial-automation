// server/src/controllers/maintenanceController.js
const MaintenanceAlert = require('../models/MaintenanceAlert');

// Get all maintenance alerts
const getMaintenanceAlerts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (status === 'resolved') {
            query.isResolved = true;
        } else if (status === 'unresolved') {
            query.isResolved = false;
        }

        const alerts = await MaintenanceAlert.find(query)
            .populate('userId', 'firstName lastName email')
            .populate('resolvedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MaintenanceAlert.countDocuments(query);

        res.json({
            success: true,
            data: alerts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching maintenance alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching maintenance alerts'
        });
    }
};

// Get maintenance alert by ID
const getMaintenanceAlert = async (req, res) => {
    try {
        const alert = await MaintenanceAlert.findById(req.params.id)
            .populate('userId', 'firstName lastName email')
            .populate('resolvedBy', 'firstName lastName email');

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance alert not found'
            });
        }

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error fetching maintenance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching maintenance alert'
        });
    }
};

// Create maintenance alert
const createMaintenanceAlert = async (req, res) => {
    try {
        const alertData = {
            ...req.body,
            userId: req.user.id // Assuming auth middleware sets req.user
        };

        const alert = await MaintenanceAlert.create(alertData);

        res.status(201).json({
            success: true,
            data: alert,
            message: 'Maintenance alert created successfully'
        });
    } catch (error) {
        console.error('Error creating maintenance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating maintenance alert'
        });
    }
};

// Update maintenance alert
const updateMaintenanceAlert = async (req, res) => {
    try {
        const alert = await MaintenanceAlert.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance alert not found'
            });
        }

        res.json({
            success: true,
            data: alert,
            message: 'Maintenance alert updated successfully'
        });
    } catch (error) {
        console.error('Error updating maintenance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating maintenance alert'
        });
    }
};

// Resolve maintenance alert
const resolveMaintenanceAlert = async (req, res) => {
    try {
        const alert = await MaintenanceAlert.findByIdAndUpdate(
            req.params.id,
            {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedBy: req.user.id
            },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance alert not found'
            });
        }

        res.json({
            success: true,
            data: alert,
            message: 'Maintenance alert resolved successfully'
        });
    } catch (error) {
        console.error('Error resolving maintenance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Error resolving maintenance alert'
        });
    }
};

// Delete maintenance alert
const deleteMaintenanceAlert = async (req, res) => {
    try {
        const alert = await MaintenanceAlert.findByIdAndDelete(req.params.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Maintenance alert deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting maintenance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting maintenance alert'
        });
    }
};

module.exports = {
    getMaintenanceAlerts,
    getMaintenanceAlert,
    createMaintenanceAlert,
    updateMaintenanceAlert,
    resolveMaintenanceAlert,
    deleteMaintenanceAlert
};