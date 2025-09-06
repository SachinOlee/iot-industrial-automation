// / server/src/models/SensorData.js
const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    machineId: {
        type: String,
        required: [true, 'Please add a machine ID'],
        trim: true
    },
    motorSpeed: {
        type: Number,
        required: true,
        min: [0, 'Motor speed cannot be negative']
    },
    voltage: {
        type: Number,
        required: true,
        min: [0, 'Voltage cannot be negative']
    },
    temperature: {
        type: Number,
        required: true
    },
    heat: {
        type: Number,
        required: true,
        min: [0, 'Heat cannot be negative']
    },
    workingStatus: {
        type: Boolean,
        required: true,
        default: false
    },
    workingPeriod: {
        type: Number,
        required: true,
        min: [0, 'Working period cannot be negative']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
sensorDataSchema.index({ userId: 1, machineId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
