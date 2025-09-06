// server/src/controllers/sensorController.js
const { validationResult } = require('express-validator');
const SensorData = require('../models/SensorData');
const MaintenanceAlert = require('../models/MaintenanceAlert');
const predictionService = require('../services/predictionService');

// @desc    Add sensor data
// @route   POST /api/sensor/data
// @access  Private
const addSensorData = async (req, res) => {
    try {
        const {
            machineId,
            motorSpeed,
            voltage,
            temperature,
            heat,
            workingStatus,
            workingPeriod
        } = req.body;

        const sensorData = await SensorData.create({
            userId: req.user.id,
            machineId,
            motorSpeed,
            voltage,
            temperature,
            heat,
            workingStatus,
            workingPeriod
        });

        // Check for anomalies and predict maintenance
        await predictionService.analyzeAndPredict(sensorData);

        res.status(201).json({
            success: true,
            data: sensorData
        });

    } catch (error) {
        console.error('Add sensor data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding sensor data'
        });
    }
};

// @desc    Get sensor data for user
// @route   GET /api/sensor/data
// @access  Private
const getSensorData = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const machineId = req.query.machineId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const startIndex = (page - 1) * limit;

        // Build query
        let query = { userId: req.user.id };

        if (machineId) {
            query.machineId = machineId;
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const sensorData = await SensorData.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip(startIndex);

        const total = await SensorData.countDocuments(query);

        res.json({
            success: true,
            count: sensorData.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: sensorData
        });

    } catch (error) {
        console.error('Get sensor data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching sensor data'
        });
    }
};

// @desc    Get latest sensor data for all machines
// @route   GET /api/sensor/latest
// @access  Private
const getLatestSensorData = async (req, res) => {
    try {
        const latestData = await SensorData.aggregate([
            { $match: { userId: req.user._id } },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: '$machineId',
                    latestData: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$latestData' }
            }
        ]);

        res.json({
            success: true,
            data: latestData
        });

    } catch (error) {
        console.error('Get latest sensor data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching latest sensor data'
        });
    }
};

// @desc    Get sensor data analytics
// @route   GET /api/sensor/analytics
// @access  Private
const getSensorAnalytics = async (req, res) => {
    try {
        const machineId = req.query.machineId;
        const period = req.query.period || '24h'; // 24h, 7d, 30d

        let dateRange;
        const now = new Date();

        switch (period) {
            case '24h':
                dateRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                dateRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        let matchQuery = {
            userId: req.user._id,
            timestamp: { $gte: dateRange }
        };

        if (machineId) {
            matchQuery.machineId = machineId;
        }

        const analytics = await SensorData.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    avgMotorSpeed: { $avg: '$motorSpeed' },
                    maxMotorSpeed: { $max: '$motorSpeed' },
                    minMotorSpeed: { $min: '$motorSpeed' },
                    avgVoltage: { $avg: '$voltage' },
                    maxVoltage: { $max: '$voltage' },
                    minVoltage: { $min: '$voltage' },
                    avgTemperature: { $avg: '$temperature' },
                    maxTemperature: { $max: '$temperature' },
                    minTemperature: { $min: '$temperature' },
                    avgHeat: { $avg: '$heat' },
                    maxHeat: { $max: '$heat' },
                    minHeat: { $min: '$heat' },
                    totalWorkingPeriod: { $sum: '$workingPeriod' },
                    totalReadings: { $sum: 1 },
                    workingStatusTrue: {
                        $sum: {
                            $cond: [{ $eq: ['$workingStatus', true] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const result = analytics[0] || {};
        result.uptime = result.totalReadings > 0 ? 
            (result.workingStatusTrue / result.totalReadings) * 100 : 0;

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get sensor analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching analytics'
        });
    }
};

// @desc    Get maintenance alerts
// @route   GET /api/sensor/alerts
// @access  Private
const getMaintenanceAlerts = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const resolved = req.query.resolved;
        const severity = req.query.severity;

        const startIndex = (page - 1) * limit;

        let query = { userId: req.user.id };

        if (resolved !== undefined) {
            query.isResolved = resolved === 'true';
        }

        if (severity) {
            query.severity = severity;
        }

        const alerts = await MaintenanceAlert.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip(startIndex)
            .populate('resolvedBy', 'firstName lastName');

        const total = await MaintenanceAlert.countDocuments(query);

        res.json({
            success: true,
            count: alerts.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: alerts
        });

    } catch (error) {
        console.error('Get maintenance alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching alerts'
        });
    }
};

// @desc    Resolve maintenance alert
// @route   PUT /api/sensor/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res) => {
    try {
        const alert = await MaintenanceAlert.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedBy: req.user.id
            },
            { new: true, runValidators: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.json({
            success: true,
            data: alert
        });

    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resolving alert'
        });
    }
};

module.exports = {
    addSensorData,
    getSensorData,
    getLatestSensorData,
    getSensorAnalytics,
    getMaintenanceAlerts,
    resolveAlert
};
