const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Data Retention Settings
  dataRetention: {
    sensorData: {
      type: Number, // days
      default: 90,
      min: 1,
      max: 3650
    },
    alerts: {
      type: Number, // days
      default: 180,
      min: 1,
      max: 3650
    },
    logs: {
      type: Number, // days
      default: 365,
      min: 1,
      max: 3650
    }
  },

  // Backup Settings
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    backupTime: {
      type: String, // HH:MM format
      default: '02:00'
    },
    lastBackup: {
      type: Date,
      default: null
    },
    backupRetention: {
      type: Number, // days
      default: 90,
      min: 1
    }
  },

  // Alert Configuration
  alerts: {
    globalDelay: {
      type: Number, // minutes
      default: 5,
      min: 0,
      max: 60
    },
    maxConcurrentAlerts: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    },
    enabledTypes: {
      temperature: { type: Boolean, default: true },
      voltage: { type: Boolean, default: true },
      vibration: { type: Boolean, default: false },
      maintenance: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      connectivity: { type: Boolean, default: true }
    },
    escalation: {
      enabled: { type: Boolean, default: false },
      levels: [{
        delay: { type: Number, default: 15 }, // minutes
        recipients: [{ type: String, trim: true }],
        message: { type: String, trim: true }
      }]
    }
  },

  // Email/SMTP Configuration
  email: {
    smtpHost: {
      type: String,
      default: 'smtp.gmail.com',
      trim: true
    },
    smtpPort: {
      type: Number,
      default: 587,
      min: 1,
      max: 65535
    },
    smtpSecure: {
      type: Boolean,
      default: false
    },
    smtpUser: {
      type: String,
      trim: true
    },
    smtpPassword: {
      type: String // This should be encrypted in production
    },
    fromEmail: {
      type: String,
      trim: true
    },
    fromName: {
      type: String,
      default: 'IoT Industrial Automation',
      trim: true
    },
    testEmail: {
      type: String,
      trim: true
    },
    templates: {
      alert: {
        subject: { type: String, default: 'System Alert - {machineId}' },
        html: { type: String }
      },
      report: {
        subject: { type: String, default: 'Daily System Report' },
        html: { type: String }
      }
    }
  },

  // Maintenance Window
  maintenance: {
    window: {
      start: {
        type: String, // HH:MM format
        default: '02:00'
      },
      end: {
        type: String, // HH:MM format
        default: '04:00'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        default: ['sunday']
      }]
    },
    autoMaintenance: {
      type: Boolean,
      default: true
    },
    lastMaintenance: {
      type: Date,
      default: null
    }
  },

  // System Statistics (cached)
  statistics: {
    totalMachines: {
      type: Number,
      default: 0
    },
    activeMachines: {
      type: Number,
      default: 0
    },
    totalAlerts: {
      type: Number,
      default: 0
    },
    dataPoints: {
      type: Number,
      default: 0
    },
    uptime: {
      type: String,
      default: '0 days'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Feature Flags
  features: {
    predictiveMaintenance: {
      type: Boolean,
      default: true
    },
    realTimeMonitoring: {
      type: Boolean,
      default: true
    },
    automatedBackups: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: false
    }
  },

  // Security Settings
  security: {
    sessionTimeout: {
      type: Number, // minutes
      default: 30,
      min: 5,
      max: 480
    },
    passwordPolicy: {
      minLength: { type: Number, default: 8, min: 6 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: true }
    },
    ipWhitelist: [{
      type: String,
      trim: true
    }],
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one settings document exists
systemSettingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne();
    if (existing) {
      const error = new Error('Only one system settings document can exist');
      return next(error);
    }
  }
  next();
});

// Static method to get the settings (singleton pattern)
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Instance method to update statistics
systemSettingsSchema.methods.updateStatistics = async function(stats) {
  Object.assign(this.statistics, stats);
  this.statistics.lastUpdated = new Date();
  return this.save();
};

// Instance method to test email configuration
systemSettingsSchema.methods.testEmailConfig = async function(testEmailAddress) {
  // This would integrate with the email service
  // For now, just validate the configuration
  const required = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'fromEmail'];
  const missing = required.filter(field => !this.email[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required email configuration: ${missing.join(', ')}`);
  }

  return {
    success: true,
    message: `Email configuration is valid. Test email would be sent to ${testEmailAddress}`
  };
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);