const { validationResult } = require('express-validator');
const Machine = require('../models/Machine');

// @desc    Get all machines
// @route   GET /api/machines
// @access  Private (Admin)
const getMachines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;
    const search = req.query.search;

    // Build query
    let query = { isActive: true };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { machineId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: []
    };

    const machines = await Machine.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Machine.countDocuments(query);

    res.json({
      success: true,
      data: {
        machines,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get machines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching machines'
    });
  }
};

// @desc    Get single machine
// @route   GET /api/machines/:id
// @access  Private (Admin)
const getMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      data: { machine }
    });
  } catch (error) {
    console.error('Get machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching machine'
    });
  }
};

// @desc    Create new machine
// @route   POST /api/machines
// @access  Private (Admin)
const createMachine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      machineId,
      name,
      location,
      type,
      description,
      ipAddress,
      firmwareVersion,
      thresholds
    } = req.body;

    // Check if machine ID already exists
    const existingMachine = await Machine.findOne({ machineId });
    if (existingMachine) {
      return res.status(400).json({
        success: false,
        message: 'Machine ID already exists'
      });
    }

    const machine = await Machine.create({
      machineId,
      name,
      location,
      type,
      description,
      ipAddress,
      firmwareVersion,
      thresholds: thresholds || {},
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    });

    res.status(201).json({
      success: true,
      message: 'Machine created successfully',
      data: { machine }
    });
  } catch (error) {
    console.error('Create machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating machine'
    });
  }
};

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Private (Admin)
const updateMachine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      machineId,
      name,
      location,
      type,
      status,
      description,
      ipAddress,
      firmwareVersion,
      thresholds,
      lastMaintenance,
      nextMaintenance
    } = req.body;

    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Check if machine ID is being changed and if it already exists
    if (machineId && machineId !== machine.machineId) {
      const existingMachine = await Machine.findOne({ machineId });
      if (existingMachine) {
        return res.status(400).json({
          success: false,
          message: 'Machine ID already exists'
        });
      }
    }

    // Update fields
    if (machineId) machine.machineId = machineId;
    if (name) machine.name = name;
    if (location) machine.location = location;
    if (type) machine.type = type;
    if (status) machine.status = status;
    if (description !== undefined) machine.description = description;
    if (ipAddress !== undefined) machine.ipAddress = ipAddress;
    if (firmwareVersion !== undefined) machine.firmwareVersion = firmwareVersion;
    if (thresholds) machine.thresholds = { ...machine.thresholds, ...thresholds };
    if (lastMaintenance) machine.lastMaintenance = new Date(lastMaintenance);
    if (nextMaintenance) machine.nextMaintenance = new Date(nextMaintenance);

    await machine.save();

    res.json({
      success: true,
      message: 'Machine updated successfully',
      data: { machine }
    });
  } catch (error) {
    console.error('Update machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating machine'
    });
  }
};

// @desc    Delete machine
// @route   DELETE /api/machines/:id
// @access  Private (Admin)
const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Soft delete by setting isActive to false
    machine.isActive = false;
    await machine.save();

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    console.error('Delete machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting machine'
    });
  }
};

// @desc    Get machine statistics
// @route   GET /api/machines/stats
// @access  Private (Admin)
const getMachineStats = async (req, res) => {
  try {
    const totalMachines = await Machine.countDocuments({ isActive: true });
    const activeMachines = await Machine.countDocuments({
      isActive: true,
      status: 'active'
    });
    const maintenanceMachines = await Machine.countDocuments({
      isActive: true,
      status: 'maintenance'
    });
    const offlineMachines = await Machine.countDocuments({
      isActive: true,
      status: 'offline'
    });

    // Get machines due for maintenance (next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const maintenanceDue = await Machine.countDocuments({
      isActive: true,
      nextMaintenance: { $lte: thirtyDaysFromNow }
    });

    // Get machine types distribution
    const typeStats = await Machine.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalMachines,
        active: activeMachines,
        maintenance: maintenanceMachines,
        offline: offlineMachines,
        maintenanceDue,
        types: typeStats
      }
    });
  } catch (error) {
    console.error('Get machine stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching machine statistics'
    });
  }
};

// @desc    Update machine thresholds
// @route   PUT /api/machines/:id/thresholds
// @access  Private (Admin)
const updateMachineThresholds = async (req, res) => {
  try {
    const { thresholds } = req.body;

    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    machine.thresholds = { ...machine.thresholds, ...thresholds };
    await machine.save();

    res.json({
      success: true,
      message: 'Machine thresholds updated successfully',
      data: { machine }
    });
  } catch (error) {
    console.error('Update machine thresholds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating machine thresholds'
    });
  }
};

// @desc    Get machines due for maintenance
// @route   GET /api/machines/maintenance-due
// @access  Private (Admin)
const getMaintenanceDue = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const machines = await Machine.find({
      isActive: true,
      nextMaintenance: { $lte: dueDate }
    }).sort({ nextMaintenance: 1 });

    res.json({
      success: true,
      data: { machines }
    });
  } catch (error) {
    console.error('Get maintenance due error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching maintenance due machines'
    });
  }
};

// @desc    Bulk update machines
// @route   PUT /api/machines/bulk
// @access  Private (Admin)
const bulkUpdateMachines = async (req, res) => {
  try {
    const { machineIds, updates } = req.body;

    if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Machine IDs array is required'
      });
    }

    const result = await Machine.updateMany(
      { _id: { $in: machineIds }, isActive: true },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} machines updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update machines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk updating machines'
    });
  }
};

module.exports = {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachineStats,
  updateMachineThresholds,
  getMaintenanceDue,
  bulkUpdateMachines
};