const { validationResult } = require('express-validator');
const SystemSettings = require('../models/SystemSettings');
const Machine = require('../models/Machine');
const sendEmail = require('../services/emailService');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get system settings
// @route   GET /api/system/settings
// @access  Private (Admin)
const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system settings'
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/system/settings
// @access  Private (Admin)
const updateSystemSettings = async (req, res) => {
  try {
    const updates = req.body;
    let settings = await SystemSettings.getSettings();

    // Update the settings
    Object.assign(settings, updates);
    await settings.save();

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating system settings'
    });
  }
};

// @desc    Update data retention settings
// @route   PUT /api/system/settings/data-retention
// @access  Private (Admin)
const updateDataRetention = async (req, res) => {
  try {
    const { sensorData, alerts, logs } = req.body;
    const settings = await SystemSettings.getSettings();

    settings.dataRetention = {
      sensorData: sensorData || settings.dataRetention.sensorData,
      alerts: alerts || settings.dataRetention.alerts,
      logs: logs || settings.dataRetention.logs
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Data retention settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update data retention error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating data retention settings'
    });
  }
};

// @desc    Update backup settings
// @route   PUT /api/system/settings/backup
// @access  Private (Admin)
const updateBackupSettings = async (req, res) => {
  try {
    const { autoBackup, backupFrequency, backupTime, backupRetention } = req.body;
    const settings = await SystemSettings.getSettings();

    settings.backup = {
      autoBackup: autoBackup !== undefined ? autoBackup : settings.backup.autoBackup,
      backupFrequency: backupFrequency || settings.backup.backupFrequency,
      backupTime: backupTime || settings.backup.backupTime,
      backupRetention: backupRetention || settings.backup.backupRetention
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Backup settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update backup settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating backup settings'
    });
  }
};

// @desc    Update alert configuration
// @route   PUT /api/system/settings/alerts
// @access  Private (Admin)
const updateAlertSettings = async (req, res) => {
  try {
    const { globalDelay, maxConcurrentAlerts, enabledTypes, escalation } = req.body;
    const settings = await SystemSettings.getSettings();

    settings.alerts = {
      globalDelay: globalDelay !== undefined ? globalDelay : settings.alerts.globalDelay,
      maxConcurrentAlerts: maxConcurrentAlerts || settings.alerts.maxConcurrentAlerts,
      enabledTypes: enabledTypes || settings.alerts.enabledTypes,
      escalation: escalation || settings.alerts.escalation
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Alert settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update alert settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating alert settings'
    });
  }
};

// @desc    Update email configuration
// @route   PUT /api/system/settings/email
// @access  Private (Admin)
const updateEmailSettings = async (req, res) => {
  try {
    const emailConfig = req.body;
    const settings = await SystemSettings.getSettings();

    settings.email = {
      ...settings.email,
      ...emailConfig
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Email settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating email settings'
    });
  }
};

// @desc    Test email configuration
// @route   POST /api/system/settings/email/test
// @access  Private (Admin)
const testEmailSettings = async (req, res) => {
  try {
    const { testEmail } = req.body;
    const settings = await SystemSettings.getSettings();

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    // Test the email configuration
    const testResult = await settings.testEmailConfig(testEmail);

    // Try to send a test email
    try {
      const message = `
        <h1>Email Configuration Test</h1>
        <p>This is a test email to verify your SMTP configuration.</p>
        <p>If you received this email, your email settings are working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `;

      await sendEmail({
        to: testEmail,
        subject: 'IoT Industrial Automation - Email Test',
        html: message
      });

      res.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`
      });
    } catch (emailError) {
      console.error('Email test failed:', emailError);
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed. Please check your SMTP settings.'
      });
    }
  } catch (error) {
    console.error('Test email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while testing email settings'
    });
  }
};

// @desc    Update maintenance window
// @route   PUT /api/system/settings/maintenance
// @access  Private (Admin)
const updateMaintenanceSettings = async (req, res) => {
  try {
    const { window, autoMaintenance } = req.body;
    const settings = await SystemSettings.getSettings();

    settings.maintenance = {
      window: window || settings.maintenance.window,
      autoMaintenance: autoMaintenance !== undefined ? autoMaintenance : settings.maintenance.autoMaintenance,
      lastMaintenance: settings.maintenance.lastMaintenance
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Maintenance settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update maintenance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating maintenance settings'
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/system/stats
// @access  Private (Admin)
const getSystemStats = async (req, res) => {
  try {
    // Get machine statistics
    const totalMachines = await Machine.countDocuments({ isActive: true });
    const activeMachines = await Machine.countDocuments({
      isActive: true,
      status: 'active'
    });

    // Get alert statistics (this would come from Alert model)
    const totalAlerts = 245; // Mock data for now

    // Get data points (this would come from SensorData model)
    const dataPoints = 1250000; // Mock data for now

    // Calculate uptime (mock for now)
    const uptime = '15 days';

    // Get disk usage (mock for now)
    const diskUsage = 65;

    // Get last backup from settings
    const settings = await SystemSettings.getSettings();
    const lastBackup = settings.backup.lastBackup;

    const stats = {
      totalMachines,
      activeMachines,
      totalAlerts,
      dataPoints,
      diskUsage,
      uptime,
      lastBackup
    };

    // Update cached statistics
    await settings.updateStatistics(stats);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system statistics'
    });
  }
};

// @desc    Create system backup
// @route   POST /api/system/backup
// @access  Private (Admin)
const createBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;

    // In a real implementation, this would:
    // 1. Create database dump
    // 2. Backup configuration files
    // 3. Compress everything
    // 4. Store in backup directory

    // For now, simulate the backup process
    setTimeout(async () => {
      const settings = await SystemSettings.getSettings();
      settings.backup.lastBackup = new Date();
      await settings.save();

      console.log(`Backup created: ${backupName}`);
    }, 2000);

    res.json({
      success: true,
      message: 'Backup creation started. This may take a few minutes.',
      data: {
        backupName,
        status: 'in_progress'
      }
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating backup'
    });
  }
};

// @desc    Get backup list
// @route   GET /api/system/backups
// @access  Private (Admin)
const getBackups = async (req, res) => {
  try {
    // In a real implementation, this would scan the backup directory
    // For now, return mock data
    const backups = [
      {
        name: 'backup-2024-01-15-10-30-00',
        size: '2.4 GB',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        status: 'completed'
      },
      {
        name: 'backup-2024-01-08-10-30-00',
        size: '2.2 GB',
        createdAt: new Date('2024-01-08T10:30:00Z'),
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      data: { backups }
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching backups'
    });
  }
};

// @desc    Clear system logs
// @route   POST /api/system/logs/clear
// @access  Private (Admin)
const clearSystemLogs = async (req, res) => {
  try {
    // In a real implementation, this would clear log files
    // For now, just simulate the operation

    console.log('System logs cleared at', new Date().toISOString());

    res.json({
      success: true,
      message: 'System logs cleared successfully'
    });
  } catch (error) {
    console.error('Clear system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing system logs'
    });
  }
};

// @desc    Get system health
// @route   GET /api/system/health
// @access  Private (Admin)
const getSystemHealth = async (req, res) => {
  try {
    // Mock system health data
    const health = {
      cpu: {
        usage: 45,
        cores: 4,
        temperature: 65
      },
      memory: {
        used: 72,
        total: '8 GB',
        available: '2.2 GB'
      },
      disk: {
        used: 65,
        total: '500 GB',
        available: '175 GB'
      },
      network: {
        connections: 28,
        bandwidth: '100 Mbps'
      },
      services: [
        { name: 'Database', status: 'running', uptime: '15 days' },
        { name: 'Web Server', status: 'running', uptime: '15 days' },
        { name: 'MQTT Broker', status: 'running', uptime: '15 days' },
        { name: 'Alert Service', status: 'running', uptime: '15 days' }
      ]
    };

    res.json({
      success: true,
      data: { health }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system health'
    });
  }
};

// @desc    Restart system services
// @route   POST /api/system/services/restart
// @access  Private (Admin)
const restartServices = async (req, res) => {
  try {
    // In a real implementation, this would restart system services
    // For now, simulate the operation

    console.log('System services restart initiated at', new Date().toISOString());

    res.json({
      success: true,
      message: 'System services restart initiated. This may take a few minutes.'
    });
  } catch (error) {
    console.error('Restart services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restarting services'
    });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  updateDataRetention,
  updateBackupSettings,
  updateAlertSettings,
  updateEmailSettings,
  testEmailSettings,
  updateMaintenanceSettings,
  getSystemStats,
  createBackup,
  getBackups,
  clearSystemLogs,
  getSystemHealth,
  restartServices
};