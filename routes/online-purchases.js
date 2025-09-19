const express = require('express');
const { body, validationResult } = require('express-validator');
const { OnlinePurchase, OnlinePurchaseItem, User, Product } = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/online-purchases
// @desc    Get all online purchases with pagination and filters
// @access  Private (Manager+)
router.get('/', [verifyToken, requireManager], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id = '',
      status = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'total_amount', 'status', 'created_at'];
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
      whereConditions.push('op.user_id = ?');
      params.push(user_id);
    }

    if (status) {
      whereConditions.push('op.status = ?');
      params.push(status);
    }

    if (start_date) {
      whereConditions.push('DATE(op.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(op.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM online_purchases op
      LEFT JOIN users u ON op.user_id = u.id
      ${whereClause}
    `;
    const countResult = await OnlinePurchase.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get online purchases
    const purchasesQuery = `
      SELECT 
        op.*,
        u.first_name, u.last_name, u.email, u.username
      FROM online_purchases op
      LEFT JOIN users u ON op.user_id = u.id
      ${whereClause}
      ORDER BY op.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const purchases = await OnlinePurchase.executeQuery(purchasesQuery, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get online purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get online purchases'
    });
  }
});

// @route   GET /api/online-purchases/:id
// @desc    Get online purchase by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await OnlinePurchase.findById(id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Get purchase items
    const items = await OnlinePurchaseItem.findByPurchase(id);

    res.json({
      success: true,
      data: { 
        purchase,
        items
      }
    });
  } catch (error) {
    console.error('Get online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get online purchase'
    });
  }
});

// @route   POST /api/online-purchases
// @desc    Create new online purchase
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('user_id').isInt().withMessage('User ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isInt().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be greater than or equal to 0'),
  body('shipping_address').isString().withMessage('Shipping address is required'),
  body('shipping_city').isString().withMessage('Shipping city is required'),
  body('shipping_state').isString().withMessage('Shipping state is required'),
  body('shipping_zip').isString().withMessage('Shipping zip code is required'),
  body('payment_method').isIn(['credit_card', 'debit_card', 'pix', 'bank_transfer']).withMessage('Invalid payment method'),
  body('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
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
      user_id,
      items,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country = 'Brazil',
      payment_method,
      status = 'pending',
      notes
    } = req.body;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate items and calculate total
    let total_amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product with ID ${item.product_id} not found`
        });
      }

      if (product.stock_quantity !== -1 && product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product ${product.name}`
        });
      }

      total_amount += item.quantity * item.unit_price;
    }

    // Create purchase with items using OnlinePurchase model
    const purchaseData = {
      user_id,
      total_amount,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
      payment_method,
      status,
      notes,
      created_at: new Date()
    };

    const newPurchase = await OnlinePurchase.createPurchaseWithItems(purchaseData, items);

    res.status(201).json({
      success: true,
      message: 'Online purchase created successfully',
      data: { purchase: newPurchase }
    });
  } catch (error) {
    console.error('Create online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create online purchase'
    });
  }
});

// @route   PUT /api/online-purchases/:id
// @desc    Update online purchase
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('shipping_address').optional().isString().withMessage('Shipping address must be a string'),
  body('shipping_city').optional().isString().withMessage('Shipping city must be a string'),
  body('shipping_state').optional().isString().withMessage('Shipping state must be a string'),
  body('shipping_zip').optional().isString().withMessage('Shipping zip code must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
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

    // Check if purchase exists
    const existingPurchase = await OnlinePurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Update purchase using OnlinePurchase model
    updateData.updated_at = new Date();
    await OnlinePurchase.updateById(id, updateData);

    // Get updated purchase
    const updatedPurchase = await OnlinePurchase.findById(id);

    res.json({
      success: true,
      message: 'Online purchase updated successfully',
      data: { purchase: updatedPurchase }
    });
  } catch (error) {
    console.error('Update online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update online purchase'
    });
  }
});

// @route   DELETE /api/online-purchases/:id
// @desc    Delete online purchase
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purchase exists
    const existingPurchase = await OnlinePurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Delete purchase using OnlinePurchase model
    await OnlinePurchase.deleteById(id);

    res.json({
      success: true,
      message: 'Online purchase deleted successfully'
    });
  } catch (error) {
    console.error('Delete online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete online purchase'
    });
  }
});

// @route   PUT /api/online-purchases/:id/confirm
// @desc    Confirm online purchase
// @access  Private (Manager+)
router.put('/:id/confirm', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purchase exists
    const existingPurchase = await OnlinePurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Confirm purchase using OnlinePurchase model
    await OnlinePurchase.confirmPurchase(id);

    res.json({
      success: true,
      message: 'Online purchase confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm online purchase'
    });
  }
});

// @route   PUT /api/online-purchases/:id/ship
// @desc    Ship online purchase
// @access  Private (Manager+)
router.put('/:id/ship', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_number } = req.body;

    // Check if purchase exists
    const existingPurchase = await OnlinePurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Ship purchase using OnlinePurchase model
    await OnlinePurchase.shipPurchase(id, tracking_number);

    res.json({
      success: true,
      message: 'Online purchase shipped successfully'
    });
  } catch (error) {
    console.error('Ship online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ship online purchase'
    });
  }
});

// @route   PUT /api/online-purchases/:id/deliver
// @desc    Mark online purchase as delivered
// @access  Private (Manager+)
router.put('/:id/deliver', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purchase exists
    const existingPurchase = await OnlinePurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Mark as delivered using OnlinePurchase model
    await OnlinePurchase.deliverPurchase(id);

    res.json({
      success: true,
      message: 'Online purchase marked as delivered successfully'
    });
  } catch (error) {
    console.error('Deliver online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark online purchase as delivered'
    });
  }
});

// @route   PUT /api/online-purchases/:id/cancel
// @desc    Cancel online purchase
// @access  Private (Manager+)
router.put('/:id/cancel', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if purchase exists
    const existingPurchase = await OnlinePurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Online purchase not found'
      });
    }

    // Cancel purchase using OnlinePurchase model
    await OnlinePurchase.cancelPurchase(id, reason);

    res.json({
      success: true,
      message: 'Online purchase cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel online purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel online purchase'
    });
  }
});

// @route   GET /api/online-purchases/user/:userId
// @desc    Get user's online purchases
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

    // Get user's online purchases using OnlinePurchase model
    const purchases = await OnlinePurchase.findByUser(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        purchases,
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
    console.error('Get user online purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user online purchases'
    });
  }
});

// @route   GET /api/online-purchases/stats/overview
// @desc    Get online purchases statistics overview
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/stats/overview', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // Get online purchase stats using OnlinePurchase model
    const purchaseInstance = new OnlinePurchase(); // Instantiated the model
    const purchaseStats = await purchaseInstance.getOnlinePurchaseStats(); // Called instance method

    res.json({
      success: true,
      data: purchaseStats
    });
  } catch (error) {
    console.error('Get online purchase stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get online purchase statistics'
    });
  }
});

module.exports = router; 