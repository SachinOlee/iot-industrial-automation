// server/src/models/SensorData.js
const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  machineId: {
    type: String,
    required: [true, 'Machine ID is required'],
    trim: true,
    index: true
  },
  motorSpeed: {
    type: Number,
    min: [0, 'Motor speed cannot be negative']
  },
  voltage: {
    type: Number,
    min: [0, 'Voltage cannot be negative']
  },
  temperature: {
    type: Number,
    required: true
  },
  heat: {
    type: Number,
    min: [0, 'Heat cannot be negative']
  },
  workingStatus: {
    type: Boolean,
    default: false
  },
  workingPeriod: {
    type: Number,
    min: [0, 'Working period cannot be negative']
  },
  pressure: {
    type: Number
  },
  vibration: {
    type: Number
  },
  humidity: {
    type: Number
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
sensorDataSchema.index({ userId: 1, machineId: 1, timestamp: -1 });
sensorDataSchema.index({ machineId: 1, timestamp: -1 });
sensorDataSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
