// server/src/models/MaintenanceAlert.js
const mongoose = require('mongoose');

const maintenanceAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    machineId: {
        type: String,
        required: true,
        trim: true
    },
    alertType: {
        type: String,
        enum: ['temperature', 'vibration', 'wear', 'failure_prediction', 'maintenance_due'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: [500, 'Message cannot be more than 500 characters']
    },
    predictedFailureDate: {
        type: Date
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date
}, {
    timestamps: true
});

// Index for better query performance
maintenanceAlertSchema.index({ userId: 1, isResolved: 1, createdAt: -1 });

module.exports = mongoose.model('MaintenanceAlert', maintenanceAlertSchema);
