const express = require('express');
const { query, validationResult } = require('express-validator');
const { AuditLog, User } = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/audit/logs
// @desc    Get audit logs with pagination and filters
// @access  Private (Manager+)
router.get('/logs', [
  verifyToken,
  requireManager,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('user_id').optional().isInt(),
  query('action').optional().isString(),
  query('table_name').optional().isString(),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('ip_address').optional().isIP(),
  query('sortBy').optional().isIn(['created_at', 'user_id', 'action', 'table_name']),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
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
      table_name,
      start_date,
      end_date,
      ip_address,
      sortBy = 'created_at',
      sortOrder = 'DESC'
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

    if (table_name) {
      whereConditions.push('al.table_name = ?');
      params.push(table_name);
    }

    if (start_date) {
      whereConditions.push('DATE(al.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(al.created_at) <= ?');
      params.push(end_date);
    }

    if (ip_address) {
      whereConditions.push('al.ip_address = ?');
      params.push(ip_address);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;
    const countResult = await AuditLog.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get audit logs
    const logsQuery = `
      SELECT 
        al.*,
        u.username, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.${sortBy} ${sortOrder}
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

// @route   GET /api/audit/:id
// @desc    Get audit log by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    // Get log with user details
    const logWithUser = await AuditLog.getLogsWithUserDetails(1, id);

    res.json({
      success: true,
      data: { log: logWithUser[0] || log }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log'
    });
  }
});

// @route   GET /api/audit/user/:userId
// @desc    Get audit logs for specific user
// @access  Private (Manager+)
router.get('/user/:userId', [
  verifyToken,
  requireManager,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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

    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's audit logs using AuditLog model
    const logs = await AuditLog.findByUser(userId, parseInt(limit), (page - 1) * parseInt(limit));

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?`;
    const countResult = await AuditLog.executeQuery(countQuery, [userId]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        logs,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user audit logs'
    });
  }
});

// @route   GET /api/audit/activity/summary
// @desc    Get activity summary
// @access  Private (Manager+)
router.get('/activity/summary', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get activity summary using AuditLog model
    const activitySummary = await AuditLog.getActivitySummary(start_date, end_date);

    res.json({
      success: true,
      data: activitySummary
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity summary'
    });
  }
});

// @route   GET /api/audit/actions/summary
// @desc    Get actions summary
// @access  Private (Manager+)
router.get('/actions/summary', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get actions summary using AuditLog model
    const actionsSummary = await AuditLog.getActionsSummary(start_date, end_date);

    res.json({
      success: true,
      data: actionsSummary
    });
  } catch (error) {
    console.error('Get actions summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get actions summary'
    });
  }
});

// @route   GET /api/audit/tables/summary
// @desc    Get tables summary
// @access  Private (Manager+)
router.get('/tables/summary', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get tables summary using AuditLog model
    const tablesSummary = await AuditLog.getTablesSummary(start_date, end_date);

    res.json({
      success: true,
      data: tablesSummary
    });
  } catch (error) {
    console.error('Get tables summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tables summary'
    });
  }
});

// @route   GET /api/audit/users/summary
// @desc    Get users activity summary
// @access  Private (Manager+)
router.get('/users/summary', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
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

    const { start_date, end_date, limit = 10 } = req.query;

    // Get users activity summary using AuditLog model
    const usersSummary = await AuditLog.getUsersActivitySummary(start_date, end_date, parseInt(limit));

    res.json({
      success: true,
      data: usersSummary
    });
  } catch (error) {
    console.error('Get users activity summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users activity summary'
    });
  }
});

// @route   DELETE /api/audit/cleanup
// @desc    Clean up old audit logs
// @access  Private (Manager+)
router.delete('/cleanup', [
  verifyToken,
  requireManager,
  query('days').optional().isInt({ min: 30, max: 365 }).toInt()
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

    const { days = 90 } = req.query;

    // Clean up old audit logs using AuditLog model
    const cleanupResult = await AuditLog.cleanupOldLogs(parseInt(days));

    res.json({
      success: true,
      message: `Cleaned up ${cleanupResult.deletedCount} audit logs older than ${days} days`,
      data: cleanupResult
    });
  } catch (error) {
    console.error('Cleanup audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup audit logs'
    });
  }
});

// @route   POST /api/audit/log
// @desc    Create audit log entry (internal use)
// @access  Private (Manager+)
router.post('/log', [
  verifyToken,
  requireManager
], async (req, res) => {
  try {
    const {
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      description
    } = req.body;

    // Create audit log using AuditLog model
    const logData = {
      user_id,
      action,
      table_name,
      record_id,
      old_values: old_values ? JSON.stringify(old_values) : null,
      new_values: new_values ? JSON.stringify(new_values) : null,
      ip_address,
      user_agent,
      description,
      created_at: new Date()
    };

    const newLog = await AuditLog.createLog(logData);

    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: { log: newLog }
    });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log'
    });
  }
});

// @route   GET /api/audit/logs/:id
// @desc    Get audit log by ID
// @access  Private (Manager+)
router.get('/logs/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const log = await AuditLog.findById(id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }
    
    res.json({
      success: true,
      data: { log }
    });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log'
    });
  }
});

// @route   GET /api/audit/stats/overview
// @desc    Get audit statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [verifyToken, requireManager], async (req, res) => {
  try {
    const auditStats = await AuditLog.getAuditStats();
    
    res.json({
      success: true,
      data: auditStats
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit statistics'
    });
  }
});

module.exports = router; 