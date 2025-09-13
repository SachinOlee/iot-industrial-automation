const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: [true, 'Machine ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Machine type is required'],
    enum: ['CNC Machine', 'Industrial Robot', 'Conveyor System', 'Packaging Machine', 'Quality Control', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'offline'],
    default: 'active'
  },
  thresholds: {
    temperature: {
      warning: {
        type: Number,
        default: 75,
        min: 0
      },
      critical: {
        type: Number,
        default: 85,
        min: 0
      }
    },
    voltage: {
      min: {
        type: Number,
        default: 200,
        min: 0
      },
      max: {
        type: Number,
        default: 250,
        min: 0
      }
    },
    motorSpeed: {
      max: {
        type: Number,
        default: 3000,
        min: 0
      }
    },
    vibration: {
      warning: {
        type: Number,
        default: 5.0,
        min: 0
      },
      critical: {
        type: Number,
        default: 10.0,
        min: 0
      }
    }
  },
  lastMaintenance: {
    type: Date,
    default: null
  },
  nextMaintenance: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  firmwareVersion: {
    type: String,
    trim: true
  },
  installationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
machineSchema.index({ machineId: 1 });
machineSchema.index({ status: 1 });
machineSchema.index({ type: 1 });
machineSchema.index({ location: 1 });

// Virtual for maintenance status
machineSchema.virtual('maintenanceStatus').get(function() {
  if (!this.nextMaintenance) return 'unknown';

  const now = new Date();
  const daysUntilMaintenance = Math.ceil((this.nextMaintenance - now) / (1000 * 60 * 60 * 24));

  if (daysUntilMaintenance < 0) return 'overdue';
  if (daysUntilMaintenance <= 7) return 'due_soon';
  if (daysUntilMaintenance <= 30) return 'upcoming';
  return 'scheduled';
});

// Instance method to check if maintenance is due
machineSchema.methods.isMaintenanceDue = function() {
  if (!this.nextMaintenance) return false;
  return new Date() >= this.nextMaintenance;
};

// Static method to get machines by status
machineSchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true });
};

// Static method to get machines due for maintenance
machineSchema.statics.getMaintenanceDue = function() {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return this.find({
    nextMaintenance: { $lte: nextWeek },
    isActive: true
  });
};

module.exports = mongoose.model('Machine', machineSchema);