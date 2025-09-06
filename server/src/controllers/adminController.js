// server/src/controllers/adminController.js
const User = require("../models/User");
const SensorData = require("../models/SensorData");
const MaintenanceAlert = require("../models/MaintenanceAlert");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search;

    const startIndex = (page - 1) * limit;

    let query = {};

    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user statistics
    const sensorDataCount = await SensorData.countDocuments({
      userId: user._id,
    });
    const alertsCount = await MaintenanceAlert.countDocuments({
      userId: user._id,
    });
    const unresolvedAlertsCount = await MaintenanceAlert.countDocuments({
      userId: user._id,
      isResolved: false,
    });

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          sensorDataCount,
          alertsCount,
          unresolvedAlertsCount,
        },
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive, isEmailVerified } =
      req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.role = role || user.role;

    if (typeof isActive !== "undefined") {
      user.isActive = isActive;
    }

    if (typeof isEmailVerified !== "undefined") {
      user.isEmailVerified = isEmailVerified;
    }

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating user",
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Delete user and related data
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      SensorData.deleteMany({ userId: req.params.id }),
      MaintenanceAlert.deleteMany({ userId: req.params.id }),
    ]);

    res.json({
      success: true,
      message: "User and related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting user",
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSensorData,
      totalAlerts,
      unresolvedAlerts,
      recentUsers,
      recentAlerts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      SensorData.countDocuments(),
      MaintenanceAlert.countDocuments(),
      MaintenanceAlert.countDocuments({ isResolved: false }),
      User.find().sort({ createdAt: -1 }).limit(5).select("-password"),
      MaintenanceAlert.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "firstName lastName email"),
    ]);

    // Get sensor data for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSensorData = await SensorData.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          count: { $sum: 1 },
          avgTemperature: { $avg: "$temperature" },
          avgVoltage: { $avg: "$voltage" },
          avgMotorSpeed: { $avg: "$motorSpeed" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get alert distribution by severity
    const alertsBySeverity = await MaintenanceAlert.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalSensorData,
          totalAlerts,
          unresolvedAlerts,
        },
        charts: {
          recentSensorData,
          alertsBySeverity,
        },
        recent: {
          users: recentUsers,
          alerts: recentAlerts,
        },
      },
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching system statistics",
    });
  }
};

// @desc    Get all sensor data (admin view)
// @route   GET /api/admin/sensor-data
// @access  Private/Admin
const getAllSensorData = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const userId = req.query.userId;
    const machineId = req.query.machineId;

    const startIndex = (page - 1) * limit;

    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (machineId) {
      query.machineId = machineId;
    }

    const sensorData = await SensorData.find(query)
      .populate("userId", "firstName lastName email")
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
        pages: Math.ceil(total / limit),
      },
      data: sensorData,
    });
  } catch (error) {
    console.error("Get all sensor data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sensor data",
    });
  }
};

// @desc    Get all maintenance alerts (admin view)
// @route   GET /api/admin/alerts
// @access  Private/Admin
const getAllAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const userId = req.query.userId;
    const severity = req.query.severity;
    const resolved = req.query.resolved;

    const startIndex = (page - 1) * limit;

    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (severity) {
      query.severity = severity;
    }

    if (resolved !== undefined) {
      query.isResolved = resolved === "true";
    }

    const alerts = await MaintenanceAlert.find(query)
      .populate("userId", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    const total = await MaintenanceAlert.countDocuments(query);

    res.json({
      success: true,
      count: alerts.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: alerts,
    });
  } catch (error) {
    console.error("Get all alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching alerts",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getSystemStats,
  getAllSensorData,
  getAllAlerts,
};
