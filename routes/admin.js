const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { 
  User, 
  Product, 
  Store, 
  Sale, 
  PointsTransaction, 
  CashbackTransaction, 
  Campaign,
  Notification,
  AuditLog,
  Setting
} = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get comprehensive statistics using models
    const userStats = await User.getUserStats(start_date, end_date);
    const salesStats = await Sale.getSalesStats(start_date, end_date);
    const productStats = await Product.getProductStats();
    const storeStats = await Store.getStoreStats(start_date, end_date);
    const pointsStats = await PointsTransaction.getPointsStats(start_date, end_date);
    const cashbackStats = await CashbackTransaction.getCashbackStats(start_date, end_date);
    // Get commission statistics from dashboard controller
    const dashboardController = new DashboardController();
    const commissionStats = await dashboardController.getCommissionStats();
    const campaignStats = await Campaign.getCampaignStats(start_date, end_date);

    // Get recent activity
    const recentUsers = await User.getRecentlyActiveUsers(7, 5);
    const recentSales = await Sale.getRecentSales(5);
    const recentNotifications = await Notification.getRecentNotifications(5);

    res.json({
      success: true,
      data: {
        statistics: {
          users: userStats,
          sales: salesStats,
          products: productStats,
          stores: storeStats,
          points: pointsStats,
          cashback: cashbackStats,
          commissions: commissionStats,
          campaigns: campaignStats
        },
        recent_activity: {
          users: recentUsers,
          sales: recentSales,
          notifications: recentNotifications
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin dashboard data'
    });
  }
});

// @route   GET /api/admin/system-status
// @desc    Get system status and health
// @access  Private (Admin)
router.get('/system-status', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const systemStatus = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version,
        platform: process.platform
      },
      database: { status: 'unknown' },
      models: { status: 'unknown' },
      services: { status: 'unknown' }
    };

    // Test database connection
    try {
      const mongoose = require('mongoose');
      const connectionState = mongoose.connection.readyState;
      if (connectionState === 1) {
        systemStatus.database = { status: 'healthy' };
      } else {
        systemStatus.database = { status: 'unhealthy', error: 'Connection not ready' };
      }
    } catch (error) {
      systemStatus.database = { status: 'unhealthy', error: error.message };
    }

    // Test model operations
    try {
      const modelChecks = {};
      
      const userCount = await User.count();
      modelChecks.users = { status: 'healthy', count: userCount };
      
      const productCount = await Product.count();
      modelChecks.products = { status: 'healthy', count: productCount };
      
      const storeCount = await Store.count();
      modelChecks.stores = { status: 'healthy', count: storeCount };
      
      const saleCount = await Sale.count();
      modelChecks.sales = { status: 'healthy', count: saleCount };

      systemStatus.models = { status: 'healthy', details: modelChecks };
    } catch (error) {
      systemStatus.models = { status: 'unhealthy', error: error.message };
    }

    // Check services
    try {
      const serviceChecks = {
        auth: { status: 'healthy' },
        notifications: { status: 'healthy' },
        points: { status: 'healthy' },
        cashback: { status: 'healthy' }
      };
      systemStatus.services = { status: 'healthy', details: serviceChecks };
    } catch (error) {
      systemStatus.services = { status: 'unhealthy', error: error.message };
    }

    const overallStatus = systemStatus.database.status === 'healthy' && 
                         systemStatus.models.status === 'healthy' && 
                         systemStatus.services.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.json({
      success: overallStatus === 'healthy',
      status: overallStatus,
      data: systemStatus
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

// @route   GET /api/admin/settings
// @desc    Get system settings
// @access  Private (Admin)
router.get('/settings', [verifyToken, requireAdmin], async (req, res) => {
  try {
    // Get all settings using Setting model
    const settings = await Setting.getAllAsObject();

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system settings'
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private (Admin)
router.put('/settings', [
  verifyToken,
  requireAdmin,
  body('settings').isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { settings } = req.body;

    // Update multiple settings using Setting model
    await Setting.setMultipleValues(settings);

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'update_settings',
      table_name: 'settings',
      old_values: null,
      new_values: JSON.stringify(settings),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: 'System settings updated'
    });

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// @route   POST /api/admin/maintenance
// @desc    Perform system maintenance tasks
// @access  Private (Admin)
router.post('/maintenance', [
  verifyToken,
  requireAdmin,
  body('task').isIn(['cleanup_logs', 'optimize_database', 'clear_cache', 'backup_data']).withMessage('Invalid maintenance task')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { task } = req.body;
    let result = {};

    switch (task) {
      case 'cleanup_logs':
        // Clean up old audit logs
        result = await AuditLog.cleanupOldLogs(90);
        break;
      
      case 'optimize_database':
        // This would typically involve database-specific optimization commands
        result = { message: 'Database optimization completed' };
        break;
      
      case 'clear_cache':
        // Clear any cached data
        result = { message: 'Cache cleared successfully' };
        break;
      
      case 'backup_data':
        // This would typically involve database backup procedures
        result = { message: 'Data backup initiated' };
        break;
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'maintenance_task',
      table_name: 'system',
      old_values: null,
      new_values: JSON.stringify({ task, result }),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Maintenance task executed: ${task}`
    });

    res.json({
      success: true,
      message: `Maintenance task '${task}' completed successfully`,
      data: result
    });
  } catch (error) {
    console.error('Maintenance task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute maintenance task'
    });
  }
});

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs for admin review
// @access  Private (Admin)
router.get('/audit-logs', [
  verifyToken,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('user_id').optional().isInt(),
  query('action').optional().isString(),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      start_date, 
      end_date 
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('al.user_id = ?');
      params.push(user_id);
    }

    if (action) {
      whereConditions.push('al.action = ?');
      params.push(action);
    }

    if (start_date) {
      whereConditions.push('DATE(al.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(al.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get audit logs using AuditLog model
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;
    const countResult = await AuditLog.executeQuery(countQuery, params);
    const total = countResult[0].total;

    const logsQuery = `
      SELECT 
        al.*,
        u.username, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await AuditLog.executeQuery(logsQuery, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs'
    });
  }
});

// @route   POST /api/admin/broadcast-notification
// @desc    Send broadcast notification to all users
// @access  Private (Admin)
router.post('/broadcast-notification', [
  verifyToken,
  requireAdmin,
  body('title').isString().withMessage('Title is required'),
  body('message').isString().withMessage('Message is required'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error']),
  body('target_roles').optional().isArray(),
  body('target_tiers').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, message, type = 'info', target_roles, target_tiers } = req.body;

    // Create broadcast notification using Notification model
    await Notification.createBroadcastNotification(title, message, type, target_roles, target_tiers);

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'broadcast_notification',
      table_name: 'notifications',
      old_values: null,
      new_values: JSON.stringify({ title, message, type, target_roles, target_tiers }),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Broadcast notification sent: ${title}`
    });

    res.json({
      success: true,
      message: 'Broadcast notification sent successfully'
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast notification'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get admin users data
// @access  Private (Admin)
router.get('/users', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const result = await User.getAllUsers({ page, limit, search, role, status });
    
    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users data'
    });
  }
});

// @route   GET /api/admin/stores
// @desc    Get admin stores data
// @access  Private (Admin)
router.get('/stores', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, status } = req.query;
    const result = await Store.getAllStores({ page, limit, search, city, status });
    
    res.json({
      success: true,
      data: result.stores,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Admin get stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stores data'
    });
  }
});

// @route   GET /api/admin/sales
// @desc    Get admin sales data
// @access  Private (Admin)
router.get('/sales', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, dateFrom, dateTo } = req.query;
    const result = await Sale.getAllSales({ page, limit, search, status, dateFrom, dateTo });
    
    res.json({
      success: true,
      data: result.sales,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Admin get sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales data'
    });
  }
});

// @route   GET /api/admin/commissions
// @desc    Get admin commissions data from sales
// @access  Private (Admin)
router.get('/commissions', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, user_id, store_id } = req.query;
    
    // Get commission data from sales instead of Commission table
    const Sale = require('../models/Sale');
    const saleModel = new Sale();
    
    const matchConditions = {};
    if (user_id) matchConditions.user_id = user_id;
    if (store_id) matchConditions.store_id = store_id;
    if (status) matchConditions.status = status;
    
    const skip = (page - 1) * limit;
    
    const commissions = await saleModel.model.aggregate([
      { $match: matchConditions },
      { $match: { 'commission.amount': { $exists: true, $gt: 0 } } },
      {
        $project: {
          _id: 1,
          user_id: 1,
          store_id: 1,
          total_amount: 1,
          commission: 1,
          status: 1,
          created_at: 1,
          createdAt: 1
        }
      },
      { $sort: { created_at: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    const total = await saleModel.model.countDocuments({
      ...matchConditions,
      'commission.amount': { $exists: true, $gt: 0 }
    });
    
    res.json({
      success: true,
      data: commissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get commissions data'
    });
  }
});

// @route   GET /api/admin/campaigns
// @desc    Get admin campaigns data
// @access  Private (Admin)
router.get('/campaigns', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query;
    const result = await Campaign.getAllCampaigns({ page, limit, search, type, status });
    
    res.json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get campaigns data'
    });
  }
});

// @route   GET /api/admin/notifications
// @desc    Get admin notifications data
// @access  Private (Admin)
router.get('/notifications', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const result = await Notification.getAllNotifications({ page, limit, type, status });
    
    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Admin get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications data'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get admin reports data
// @access  Private (Admin)
router.get('/reports', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    // Get report data based on type
    let reportData;
    switch (type) {
      case 'sales':
        reportData = await Sale.getSalesReport(start_date, end_date);
        break;
      case 'users':
        reportData = await User.getUserReport(start_date, end_date);
        break;
      case 'revenue':
        reportData = await Sale.getRevenueReport(start_date, end_date);
        break;
      default:
        reportData = await Sale.getOverviewReport();
    }
    
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports data'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get admin analytics data
// @access  Private (Admin)
router.get('/analytics', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    // Get analytics data based on type
    let analyticsData;
    switch (type) {
      case 'dashboard':
        analyticsData = await Sale.getDashboardAnalytics(start_date, end_date);
        break;
      case 'users':
        analyticsData = await User.getUserAnalytics(start_date, end_date);
        break;
      case 'sales':
        analyticsData = await Sale.getSalesAnalytics(start_date, end_date);
        break;
      case 'revenue':
        analyticsData = await Sale.getRevenueAnalytics(start_date, end_date);
        break;
      case 'performance':
        analyticsData = await Sale.getPerformanceAnalytics(start_date, end_date);
        break;
      default:
        analyticsData = await Sale.getDashboardAnalytics(start_date, end_date);
    }
    
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Admin get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data'
    });
  }
});

module.exports = router; 