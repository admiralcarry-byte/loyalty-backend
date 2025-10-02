const express = require('express');
const { body, validationResult } = require('express-validator');
const { CashbackTransaction, User } = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cashback
// @desc    Get all cashback transactions with pagination and filters
// @access  Private (Manager+)
router.get('/', [verifyToken, requireManager], async (req, res) => {
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
    const validSortFields = ['id', 'amount', 'type', 'status', 'created_at'];
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
      whereConditions.push('ct.user_id = ?');
      params.push(user_id);
    }

    if (type) {
      whereConditions.push('ct.type = ?');
      params.push(type);
    }

    if (status) {
      whereConditions.push('ct.status = ?');
      params.push(status);
    }

    if (start_date) {
      whereConditions.push('DATE(ct.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(ct.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM cashback_transactions ct
      LEFT JOIN users u ON ct.user_id = u.id
      ${whereClause}
    `;
    const countResult = await CashbackTransaction.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get cashback transactions
    const transactionsQuery = `
      SELECT 
        ct.*,
        u.first_name, u.last_name, u.email, u.username
      FROM cashback_transactions ct
      LEFT JOIN users u ON ct.user_id = u.id
      ${whereClause}
      ORDER BY ct.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const transactions = await CashbackTransaction.executeQuery(transactionsQuery, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get cashback transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cashback transactions'
    });
  }
});

// @route   GET /api/cashback/:id
// @desc    Get cashback transaction by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await CashbackTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Cashback transaction not found'
      });
    }

    // Get transaction with user details
    const transactionWithDetails = await CashbackTransaction.getTransactionsWithUserDetails(1, id);

    res.json({
      success: true,
      data: { transaction: transactionWithDetails[0] || transaction }
    });
  } catch (error) {
    console.error('Get cashback transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cashback transaction'
    });
  }
});

// @route   POST /api/cashback
// @desc    Create new cashback transaction
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('user_id').isInt().withMessage('User ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be greater than or equal to 0'),
  body('type').isIn(['purchase', 'referral', 'bonus', 'adjustment']).withMessage('Invalid transaction type'),
  body('status').optional().isIn(['pending', 'approved', 'paid', 'rejected']).withMessage('Invalid status'),
  body('reference_type').optional().isString().withMessage('Reference type must be a string'),
  body('reference_id').optional().isInt().withMessage('Reference ID must be an integer'),
  body('description').optional().isString().withMessage('Description must be a string')
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
      amount,
      type,
      status = 'pending',
      reference_type,
      reference_id,
      description
    } = req.body;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create cashback transaction using CashbackTransaction model
    const transactionData = {
      user_id,
      amount,
      type,
      status,
      reference_type,
      reference_id,
      description,
      created_at: new Date()
    };

    const newTransaction = await CashbackTransaction.create(transactionData);

    res.status(201).json({
      success: true,
      message: 'Cashback transaction created successfully',
      data: { transaction: newTransaction }
    });
  } catch (error) {
    console.error('Create cashback transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cashback transaction'
    });
  }
});

// @route   PUT /api/cashback/:id
// @desc    Update cashback transaction
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('status').optional().isIn(['pending', 'approved', 'paid', 'rejected']).withMessage('Invalid status'),
  body('description').optional().isString().withMessage('Description must be a string')
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
    const { status, description } = req.body;

    // Check if transaction exists
    const existingTransaction = await CashbackTransaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Cashback transaction not found'
      });
    }

    // Update transaction using CashbackTransaction model
    const updateData = { updated_at: new Date() };
    if (status) updateData.status = status;
    if (description) updateData.description = description;

    await CashbackTransaction.updateById(id, updateData);

    // Get updated transaction
    const updatedTransaction = await CashbackTransaction.findById(id);

    res.json({
      success: true,
      message: 'Cashback transaction updated successfully',
      data: { transaction: updatedTransaction }
    });
  } catch (error) {
    console.error('Update cashback transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cashback transaction'
    });
  }
});

// @route   DELETE /api/cashback/:id
// @desc    Delete cashback transaction
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const existingTransaction = await CashbackTransaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Cashback transaction not found'
      });
    }

    // Delete transaction using CashbackTransaction model
    await CashbackTransaction.deleteById(id);

    res.json({
      success: true,
      message: 'Cashback transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete cashback transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cashback transaction'
    });
  }
});

// @route   PUT /api/cashback/:id/approve
// @desc    Approve cashback transaction
// @access  Private (Manager+)
router.put('/:id/approve', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const existingTransaction = await CashbackTransaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Cashback transaction not found'
      });
    }

    // Approve transaction using CashbackTransaction model
    await CashbackTransaction.approveTransaction(id);

    res.json({
      success: true,
      message: 'Cashback transaction approved successfully'
    });
  } catch (error) {
    console.error('Approve cashback transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve cashback transaction'
    });
  }
});

// @route   PUT /api/cashback/:id/mark-paid
// @desc    Mark cashback transaction as paid
// @access  Private (Manager+)
router.put('/:id/mark-paid', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const existingTransaction = await CashbackTransaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Cashback transaction not found'
      });
    }

    // Mark transaction as paid using CashbackTransaction model
    await CashbackTransaction.markAsPaid(id);

    res.json({
      success: true,
      message: 'Cashback transaction marked as paid successfully'
    });
  } catch (error) {
    console.error('Mark cashback transaction as paid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark cashback transaction as paid'
    });
  }
});

// @route   GET /api/cashback/user/:userId
// @desc    Get user's cashback transactions
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

    // Get user's cashback transactions using CashbackTransaction model
    const transactions = await CashbackTransaction.findByUser(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
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
    console.error('Get user cashback transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user cashback transactions'
    });
  }
});

// @route   GET /api/cashback/stats/overview
// @desc    Get cashback statistics overview
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/stats/overview', [], async (req, res) => {
  try {
    // Get cashback stats using CashbackTransaction model
    const cashbackInstance = new CashbackTransaction();
    const cashbackStats = await cashbackInstance.getCashbackStats();

    // Get additional stats needed for dashboard
    const userModel = new User();
    const totalUsers = await userModel.getTotalUsersCount();
    const avgGrowthRate = await userModel.getAverageGrowthRate();

    // Enhanced stats with additional fields
    const enhancedStats = {
      ...cashbackStats,
      total_users: totalUsers || 0,
      base_cashback_rate: 2.0, // This should come from settings in production
      avg_growth_rate: avgGrowthRate || 0
    };

    res.json({
      success: true,
      data: enhancedStats
    });
  } catch (error) {
    console.error('Get cashback stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cashback statistics'
    });
  }
});

// @route   GET /api/cashback/config
// @desc    Get cashback settings configuration  
// @access  Public (for testing)
router.get('/config', [], async (req, res) => {
  try {
    // Get current commission settings from database
    const CommissionSettings = require('../models/CommissionSettings');
    const commissionSettingsModel = new CommissionSettings();
    const settings = await commissionSettingsModel.model.getCurrentSettings();
    
    // Return cashback settings from database
    const cashbackSettings = {
      base_cashback_rate: settings.cashback_rate, // Retrieve from database
      tier_benefits: {
        Lead: {
          multiplier: 1.0,
          min_purchase: 0,
          bonus_rate: 0,
          upgrade_requirement: 50
        },
        Silver: {
          multiplier: 1.2,
          min_purchase: 50,
          bonus_rate: 1.0,
          upgrade_requirement: 150
        },
        Gold: {
          multiplier: 1.5,
          min_purchase: 150,
          bonus_rate: 2.0,
          upgrade_requirement: 300
        },
        Platinum: {
          multiplier: 2.0,
          min_purchase: 300,
          bonus_rate: 3.0,
          upgrade_requirement: null
        }
      },
      volume_bonuses: [
        { threshold: 100, bonus: 5.0 },
        { threshold: 200, bonus: 10.0 },
        { threshold: 500, bonus: 20.0 }
      ],
      loyalty_program: {
        enabled: true,
        streak_bonus: 2.0,
        referral_bonus: 10.0,
        birthday_bonus: 50.0
      }
    };

    res.json({
      success: true,
      data: cashbackSettings
    });
  } catch (error) {
    console.error('Get cashback settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cashback settings'
    });
  }
});

// @route   GET /api/cashback/top-earners
// @desc    Get top cashback earners
// @access  Private (Manager+)
router.get('/top-earners', [verifyToken, requireManager], async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get top cashback earners using CashbackTransaction model
    const topEarners = await CashbackTransaction.getTopCashbackEarners(parseInt(limit));

    res.json({
      success: true,
      data: { users: topEarners }
    });
  } catch (error) {
    console.error('Get top cashback earners error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top cashback earners'
    });
  }
});

module.exports = router; 