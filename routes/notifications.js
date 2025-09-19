const express = require('express');
const { body, validationResult } = require('express-validator');
const { Notification, User } = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications with pagination and filters
// @access  Private (Manager+)
router.get('/', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // For now, return empty data structure
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Original implementation (commented out for now)
router.get('/old', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id = '',
      type = '',
      status = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'type', 'status', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort field'
      });
    }

    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort order'
      });
    }

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('n.user_id = ?');
      params.push(user_id);
    }

    if (type) {
      whereConditions.push('n.type = ?');
      params.push(type);
    }

    if (status) {
      whereConditions.push('n.status = ?');
      params.push(status);
    }

    if (start_date) {
      whereConditions.push('DATE(n.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(n.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
    `;
    const countResult = await Notification.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get notifications
    const notificationsQuery = `
      SELECT 
        n.*,
        u.first_name, u.last_name, u.email, u.username
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const notifications = await Notification.executeQuery(notificationsQuery, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Get notification with user details
    const notificationWithDetails = await Notification.getNotificationsWithUserDetails(1, id);

    res.json({
      success: true,
      data: { notification: notificationWithDetails[0] || notification }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create new notification
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('message').trim().isLength({ min: 5 }).withMessage('Message must be at least 5 characters'),
  body('type').isIn(['info', 'success', 'warning', 'error', 'promotion']).withMessage('Invalid notification type'),
  body('user_id').optional().isInt().withMessage('User ID must be an integer'),
  body('status').optional().isIn(['unread', 'read']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      message,
      type,
      user_id,
      status = 'unread',
      reference_type,
      reference_id,
      priority = 'normal'
    } = req.body;

    // Check if user exists if user_id is provided
    if (user_id) {
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found'
        });
      }
    }

    // Create notification using Notification model
    const notificationData = {
      user_id,
      title,
      message,
      type,
      status,
      reference_type,
      reference_id,
      priority,
      created_at: new Date()
    };

    const newNotification = await Notification.create(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification: newNotification }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// @route   PUT /api/notifications/:id
// @desc    Update notification
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('title').optional().trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('message').optional().trim().isLength({ min: 5 }).withMessage('Message must be at least 5 characters'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error', 'promotion']).withMessage('Invalid notification type'),
  body('status').optional().isIn(['unread', 'read']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if notification exists
    const existingNotification = await Notification.findById(id);
    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Update notification using Notification model
    updateData.updated_at = new Date();
    await Notification.updateById(id, updateData);

    // Get updated notification
    const updatedNotification = await Notification.findById(id);

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: { notification: updatedNotification }
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists
    const existingNotification = await Notification.findById(id);
    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Delete notification using Notification model
    await Notification.deleteById(id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// @route   GET /api/notifications/user/:userId
// @desc    Get user's notifications
// @access  Private (Manager+)
router.get('/user/:userId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unread_only = false } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's notifications using Notification model
    let notifications;
    if (unread_only === 'true') {
      notifications = await Notification.findUnreadByUser(userId, parseInt(limit));
    } else {
      notifications = await Notification.findByUser(userId, parseInt(limit));
    }

    // Get unread count
    const unreadCount = await Notification.getUserNotificationCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      }
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user notifications'
    });
  }
});

// @route   PUT /api/notifications/:id/mark-read
// @desc    Mark notification as read
// @access  Private (Manager+)
router.put('/:id/mark-read', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists
    const existingNotification = await Notification.findById(id);
    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Mark notification as read using Notification model
    await Notification.markAsRead(id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT /api/notifications/user/:userId/mark-all-read
// @desc    Mark all user notifications as read
// @access  Private (Manager+)
router.put('/user/:userId/mark-all-read', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Mark all notifications as read using Notification model
    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// @route   GET /api/notifications/old
// @desc    Get old notifications
// @access  Private (Manager+)
router.get('/old', [verifyToken, requireManager], async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const oldNotifications = await Notification.getOldNotifications(parseInt(limit));

    res.json({
      success: true,
      data: oldNotifications
    });
  } catch (error) {
    console.error('Get old notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get old notifications'
    });
  }
});

// @route   GET /api/notifications/user/:userId
// @desc    Get notifications by user
// @access  Private (Manager+)
router.get('/user/:userId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const notifications = await Notification.getNotificationsByUser(userId, parseInt(limit));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications by user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications by user'
    });
  }
});

// @route   GET /api/notifications/stats/overview
// @desc    Get notifications statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [verifyToken, requireManager], async (req, res) => {
  try {
    // Get notification stats using Notification model
    const notificationStats = await Notification.getNotificationStats();

    res.json({
      success: true,
      data: notificationStats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
});

module.exports = router; 