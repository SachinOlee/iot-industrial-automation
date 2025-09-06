const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  machineId: {
    type: String,
    required: [true, 'Machine ID is required'],
    index: true
  },
  message: {
    type: String,
    required: [true, 'Alert message is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  sensorData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorData'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ machineId: 1, isResolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);