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

// @route   POST /api/bulk/users
// @desc    Bulk create users
// @access  Private (Admin only)
router.post('/users', [
  verifyToken, 
  requireAdmin,
  body('users').isArray().withMessage('Users must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { users } = req.body;
    const results = await User.bulkCreate(users);

    res.json({
      success: true,
      message: 'Users created successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create users'
    });
  }
});

// @route   PUT /api/bulk/users
// @desc    Bulk update users
// @access  Private (Admin only)
router.put('/users', [
  verifyToken, 
  requireAdmin,
  body('users').isArray().withMessage('Users must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { users } = req.body;
    const results = await User.bulkUpdate(users);

    res.json({
      success: true,
      message: 'Users updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update users'
    });
  }
});

// @route   DELETE /api/bulk/users
// @desc    Bulk delete users
// @access  Private (Admin only)
router.delete('/users', [
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
    const results = await User.bulkDelete(user_ids);

    res.json({
      success: true,
      message: 'Users deleted successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete users'
    });
  }
});

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
        const notificationModel = new Notification();
        await notificationModel.create({
          title: title,
          message: message,
          type: type || 'info',
          category: 'general',
          priority: priority || 'normal',
          recipients: [{
            user: userId,
            delivery_status: 'delivered'
          }],
          created_by: userId,
          created_at: new Date()
        });
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

// @route   POST /api/bulk/stores
// @desc    Bulk create stores
// @access  Private (Admin only)
router.post('/stores', [
  verifyToken, 
  requireAdmin,
  body('stores').isArray().withMessage('Stores must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { stores } = req.body;
    const results = await Store.bulkCreate(stores);

    res.json({
      success: true,
      message: 'Stores created successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk create stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stores'
    });
  }
});

// @route   PUT /api/bulk/stores
// @desc    Bulk update stores
// @access  Private (Admin only)
router.put('/stores', [
  verifyToken, 
  requireAdmin,
  body('stores').isArray().withMessage('Stores must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { stores } = req.body;
    const results = await Store.bulkUpdate(stores);

    res.json({
      success: true,
      message: 'Stores updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk update stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stores'
    });
  }
});

// @route   DELETE /api/bulk/stores
// @desc    Bulk delete stores
// @access  Private (Admin only)
router.delete('/stores', [
  verifyToken, 
  requireAdmin,
  body('store_ids').isArray().withMessage('Store IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_ids } = req.body;
    const results = await Store.bulkDelete(store_ids);

    res.json({
      success: true,
      message: 'Stores deleted successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk delete stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete stores'
    });
  }
});

// @route   POST /api/bulk/sales
// @desc    Bulk create sales
// @access  Private (Admin only)
router.post('/sales', [
  verifyToken, 
  requireAdmin,
  body('sales').isArray().withMessage('Sales must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sales } = req.body;
    const results = await Sale.bulkCreate(sales);

    res.json({
      success: true,
      message: 'Sales created successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk create sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sales'
    });
  }
});

// @route   PUT /api/bulk/sales
// @desc    Bulk update sales
// @access  Private (Admin only)
router.put('/sales', [
  verifyToken, 
  requireAdmin,
  body('sales').isArray().withMessage('Sales must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sales } = req.body;
    const results = await Sale.bulkUpdate(sales);

    res.json({
      success: true,
      message: 'Sales updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk update sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sales'
    });
  }
});

// @route   DELETE /api/bulk/sales
// @desc    Bulk delete sales
// @access  Private (Admin only)
router.delete('/sales', [
  verifyToken, 
  requireAdmin,
  body('sale_ids').isArray().withMessage('Sale IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sale_ids } = req.body;
    const results = await Sale.bulkDelete(sale_ids);

    res.json({
      success: true,
      message: 'Sales deleted successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk delete sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sales'
    });
  }
});

// @route   POST /api/bulk/commissions
// @desc    Bulk create commissions
// @access  Private (Admin only)
router.post('/commissions', [
  verifyToken, 
  requireAdmin,
  body('commissions').isArray().withMessage('Commissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { commissions } = req.body;
    const results = await Commission.bulkCreate(commissions);

    res.json({
      success: true,
      message: 'Commissions created successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk create commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create commissions'
    });
  }
});

// @route   PUT /api/bulk/commissions
// @desc    Bulk update commissions
// @access  Private (Admin only)
router.put('/commissions', [
  verifyToken, 
  requireAdmin,
  body('commissions').isArray().withMessage('Commissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { commissions } = req.body;
    const results = await Commission.bulkUpdate(commissions);

    res.json({
      success: true,
      message: 'Commissions updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk update commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update commissions'
    });
  }
});

// @route   DELETE /api/bulk/commissions
// @desc    Bulk delete commissions
// @access  Private (Admin only)
router.delete('/commissions', [
  verifyToken, 
  requireAdmin,
  body('commission_ids').isArray().withMessage('Commission IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { commission_ids } = req.body;
    const results = await Commission.bulkDelete(commission_ids);

    res.json({
      success: true,
      message: 'Commissions deleted successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk delete commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete commissions'
    });
  }
});

// @route   POST /api/bulk/notifications
// @desc    Bulk create notifications
// @access  Private (Admin only)
router.post('/notifications', [
  verifyToken, 
  requireAdmin,
  body('notifications').isArray().withMessage('Notifications must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { notifications } = req.body;
    const results = await Notification.bulkCreate(notifications);

    res.json({
      success: true,
      message: 'Notifications created successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk create notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notifications'
    });
  }
});

// @route   PUT /api/bulk/notifications
// @desc    Bulk update notifications
// @access  Private (Admin only)
router.put('/notifications', [
  verifyToken, 
  requireAdmin,
  body('notifications').isArray().withMessage('Notifications must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { notifications } = req.body;
    const results = await Notification.bulkUpdate(notifications);

    res.json({
      success: true,
      message: 'Notifications updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk update notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notifications'
    });
  }
});

// @route   DELETE /api/bulk/notifications
// @desc    Bulk delete notifications
// @access  Private (Admin only)
router.delete('/notifications', [
  verifyToken, 
  requireAdmin,
  body('notification_ids').isArray().withMessage('Notification IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { notification_ids } = req.body;
    const results = await Notification.bulkDelete(notification_ids);

    res.json({
      success: true,
      message: 'Notifications deleted successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notifications'
    });
  }
});

module.exports = router;