const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
  User, 
  Product, 
  Store, 
  Sale, 
  PointsTransaction, 
  CashbackTransaction,
  Commission,
  Notification,
  AuditLog
} = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bulk/users/update
// @desc    Bulk update users (status, role, tier, etc.)
// @access  Private (Admin only)
router.post('/users/update', [
  verifyToken, 
  requireAdmin,
  body('user_ids').isArray().withMessage('User IDs must be an array'),
  body('updates').isObject().withMessage('Updates must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { user_ids, updates } = req.body;

    if (user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No user IDs provided'
      });
    }

    // Validate update fields
    const allowedFields = ['status', 'role', 'loyalty_tier'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid update fields: ${invalidFields.join(', ')}`
      });
    }

    let updatedCount = 0;

    // Update each user individually using User model
    for (const userId of user_ids) {
      try {
        await User.updateById(userId, updates);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update user ${userId}:`, error);
      }
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'bulk_update_users',
      table_name: 'users',
      old_values: null,
      new_values: JSON.stringify({ user_ids, updates }),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Bulk updated ${updatedCount} users`
    });

    res.json({
      success: true,
      data: {
        updated_count: updatedCount,
        message: `Successfully updated ${updatedCount} users`
      }
    });
  } catch (error) {
    console.error('Error bulk updating users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update users'
    });
  }
});

// @route   POST /api/bulk/users/delete
// @desc    Bulk delete users
// @access  Private (Admin only)
router.post('/users/delete', [
  verifyToken, 
  requireAdmin,
  body('user_ids').isArray().withMessage('User IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { user_ids } = req.body;

    if (user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No user IDs provided'
      });
    }

    let deletedCount = 0;

    // Delete each user individually using User model
    for (const userId of user_ids) {
      try {
        await User.deleteById(userId);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
      }
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'bulk_delete_users',
      table_name: 'users',
      old_values: JSON.stringify({ user_ids }),
      new_values: null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Bulk deleted ${deletedCount} users`
    });

    res.json({
      success: true,
      data: {
        deleted_count: deletedCount,
        message: `Successfully deleted ${deletedCount} users`
      }
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete users'
    });
  }
});

// @route   POST /api/bulk/products/update
// @desc    Bulk update products (price, status, etc.)
// @access  Private (Admin only)
router.post('/products/update', [
  verifyToken, 
  requireAdmin,
  body('product_ids').isArray().withMessage('Product IDs must be an array'),
  body('updates').isObject().withMessage('Updates must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { product_ids, updates } = req.body;

    if (product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No product IDs provided'
      });
    }

    // Validate update fields
    const allowedFields = ['price', 'status', 'category', 'points_per_liter'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid update fields: ${invalidFields.join(', ')}`
      });
    }

    let updatedCount = 0;

    // Update each product individually using Product model
    for (const productId of product_ids) {
      try {
        await Product.updateById(productId, updates);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update product ${productId}:`, error);
      }
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'bulk_update_products',
      table_name: 'products',
      old_values: null,
      new_values: JSON.stringify({ product_ids, updates }),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Bulk updated ${updatedCount} products`
    });

    res.json({
      success: true,
      data: {
        updated_count: updatedCount,
        message: `Successfully updated ${updatedCount} products`
      }
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update products'
    });
  }
});

// @route   POST /api/bulk/products/delete
// @desc    Bulk delete products
// @access  Private (Admin only)
router.post('/products/delete', [
  verifyToken, 
  requireAdmin,
  body('product_ids').isArray().withMessage('Product IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { product_ids } = req.body;

    if (product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No product IDs provided'
      });
    }

    let deletedCount = 0;

    // Delete each product individually using Product model
    for (const productId of product_ids) {
      try {
        await Product.deleteById(productId);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete product ${productId}:`, error);
      }
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'bulk_delete_products',
      table_name: 'products',
      old_values: JSON.stringify({ product_ids }),
      new_values: null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Bulk deleted ${deletedCount} products`
    });

    res.json({
      success: true,
      data: {
        deleted_count: deletedCount,
        message: `Successfully deleted ${deletedCount} products`
      }
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete products'
    });
  }
});

// @route   POST /api/bulk/points/add
// @desc    Bulk add points to users
// @access  Private (Admin only)
router.post('/points/add', [
  verifyToken, 
  requireAdmin,
  body('user_ids').isArray().withMessage('User IDs must be an array'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('reason').isString().withMessage('Reason is required'),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { user_ids, points, reason, reference_type, reference_id } = req.body;

    if (user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No user IDs provided'
      });
    }

    let processedCount = 0;

    // Add points to each user using PointsTransaction model
    for (const userId of user_ids) {
      try {
        await PointsTransaction.addPoints(userId, points, reason, reference_type, reference_id);
        await User.updatePointsBalance(userId, points);
        processedCount++;
      } catch (error) {
        console.error(`Failed to add points to user ${userId}:`, error);
      }
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'bulk_add_points',
      table_name: 'points_transactions',
      old_values: null,
      new_values: JSON.stringify({ user_ids, points, reason }),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Bulk added ${points} points to ${processedCount} users`
    });

    res.json({
      success: true,
      data: {
        processed_count: processedCount,
        total_points_added: processedCount * points,
        message: `Successfully added ${points} points to ${processedCount} users`
      }
    });
  } catch (error) {
    console.error('Error bulk adding points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk add points'
    });
  }
});

// @route   POST /api/bulk/notifications/send
// @desc    Bulk send notifications to users
// @access  Private (Admin only)
router.post('/notifications/send', [
  verifyToken, 
  requireAdmin,
  body('user_ids').isArray().withMessage('User IDs must be an array'),
  body('title').isString().withMessage('Title is required'),
  body('message').isString().withMessage('Message is required'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error']),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { user_ids, title, message, type = 'info', priority = 'medium' } = req.body;

    if (user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No user IDs provided'
      });
    }

    let sentCount = 0;

    // Send notification to each user using Notification model
    for (const userId of user_ids) {
      try {
        await Notification.createUserNotification(userId, title, message, type, priority);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }

    // Create audit log
    await AuditLog.createLog({
      user_id: req.user.id,
      action: 'bulk_send_notifications',
      table_name: 'notifications',
      old_values: null,
      new_values: JSON.stringify({ user_ids, title, message, type, priority }),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      description: `Bulk sent notifications to ${sentCount} users`
    });

    res.json({
      success: true,
      data: {
        sent_count: sentCount,
        message: `Successfully sent notifications to ${sentCount} users`
      }
    });
  } catch (error) {
    console.error('Error bulk sending notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk send notifications'
    });
  }
});

module.exports = router;