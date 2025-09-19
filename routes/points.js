const express = require('express');
const { body, validationResult } = require('express-validator');
const { PointsTransaction, User } = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/points
// @desc    Get all points transactions with pagination and filters
// @access  Private (Manager+)
router.get('/', [verifyToken, requireManager], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id = '',
      transaction_type = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'points', 'transaction_type', 'created_at'];
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
      whereConditions.push('pt.user_id = ?');
      params.push(user_id);
    }

    if (transaction_type) {
      whereConditions.push('pt.transaction_type = ?');
      params.push(transaction_type);
    }

    if (start_date) {
      whereConditions.push('DATE(pt.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(pt.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM points_transactions pt
      LEFT JOIN users u ON pt.user_id = u.id
      ${whereClause}
    `;
    const countResult = await PointsTransaction.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get points transactions
    const transactionsQuery = `
      SELECT 
        pt.*,
        u.first_name, u.last_name, u.email, u.username
      FROM points_transactions pt
      LEFT JOIN users u ON pt.user_id = u.id
      ${whereClause}
      ORDER BY pt.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const transactions = await PointsTransaction.executeQuery(transactionsQuery, [...params, parseInt(limit), offset]);

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
    console.error('Get points transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get points transactions'
    });
  }
});

// @route   GET /api/points/:id
// @desc    Get points transaction by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await PointsTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Points transaction not found'
      });
    }

    // Get transaction with user details
    const transactionWithDetails = await PointsTransaction.getTransactionsWithUserDetails(1, id);

    res.json({
      success: true,
      data: { transaction: transactionWithDetails[0] || transaction }
    });
  } catch (error) {
    console.error('Get points transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get points transaction'
    });
  }
});

// @route   POST /api/points
// @desc    Create new points transaction
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('user_id').isInt().withMessage('User ID is required'),
  body('points').isInt().withMessage('Points must be an integer'),
  body('transaction_type').isIn(['earned', 'spent', 'bonus', 'adjustment', 'expired']).withMessage('Invalid transaction type'),
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
      points,
      transaction_type,
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

    // Create points transaction using PointsTransaction model
    const transactionData = {
      user_id,
      points,
      transaction_type,
      reference_type,
      reference_id,
      description,
      created_at: new Date()
    };

    const newTransaction = await PointsTransaction.create(transactionData);

    // Update user's points balance
    if (transaction_type === 'earned' || transaction_type === 'bonus') {
      await User.updatePointsBalance(user_id, points);
    } else if (transaction_type === 'spent' || transaction_type === 'expired') {
      await User.updatePointsBalance(user_id, -points);
    }

    res.status(201).json({
      success: true,
      message: 'Points transaction created successfully',
      data: { transaction: newTransaction }
    });
  } catch (error) {
    console.error('Create points transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create points transaction'
    });
  }
});

// @route   PUT /api/points/:id
// @desc    Update points transaction
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
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
    const { description } = req.body;

    // Check if transaction exists
    const existingTransaction = await PointsTransaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Points transaction not found'
      });
    }

    // Update transaction using PointsTransaction model
    const updateData = { updated_at: new Date() };
    if (description) updateData.description = description;

    await PointsTransaction.updateById(id, updateData);

    // Get updated transaction
    const updatedTransaction = await PointsTransaction.findById(id);

    res.json({
      success: true,
      message: 'Points transaction updated successfully',
      data: { transaction: updatedTransaction }
    });
  } catch (error) {
    console.error('Update points transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update points transaction'
    });
  }
});

// @route   DELETE /api/points/:id
// @desc    Delete points transaction
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const existingTransaction = await PointsTransaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Points transaction not found'
      });
    }

    // Delete transaction using PointsTransaction model
    await PointsTransaction.deleteById(id);

    res.json({
      success: true,
      message: 'Points transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete points transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete points transaction'
    });
  }
});

// @route   GET /api/points/user/:userId
// @desc    Get user's points transactions
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

    // Get user's points transactions using PointsTransaction model
    const transactions = await PointsTransaction.findByUser(userId, parseInt(limit));

    // Get user's current points balance
    const userBalance = await PointsTransaction.getUserBalance(userId);

    res.json({
      success: true,
      data: {
        transactions,
        currentBalance: userBalance,
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
    console.error('Get user points transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user points transactions'
    });
  }
});

// @route   GET /api/points/stats/overview
// @desc    Get points statistics overview
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/stats/overview', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // Get points stats using PointsTransaction model
    const pointsInstance = new PointsTransaction();
    const pointsStats = await pointsInstance.getPointsStats();

    res.json({
      success: true,
      data: pointsStats
    });
  } catch (error) {
    console.error('Get points stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get points statistics'
    });
  }
});

// @route   GET /api/points/top-earners
// @desc    Get top points earners
// @access  Private (Manager+)
router.get('/top-earners', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get top points earners using PointsTransaction model
    const topEarners = await PointsTransaction.getTopPointsEarners(parseInt(limit));

    res.json({
      success: true,
      data: { users: topEarners }
    });
  } catch (error) {
    console.error('Get top points earners error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top points earners'
    });
  }
});

module.exports = router; 