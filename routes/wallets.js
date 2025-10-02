const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { 
  User, 
  PointsTransaction, 
  CashbackTransaction, 
  Commission,
  Notification
} = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/wallets/:userId
// @desc    Get user wallet information
// @access  Private (Manager+)
router.get('/:userId', [verifyToken, requireManager], async (req, res) => {
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

    // Get user's points balance using PointsTransaction model
    const pointsBalance = await PointsTransaction.getUserBalance(userId);

    // Get user's cashback balance using CashbackTransaction model
    const cashbackBalance = await CashbackTransaction.getUserBalance(userId);

    // Get pending commissions using Commission model
    const pendingCommissions = await Commission.findPending(userId, 10);

    // Get recent transactions
    const recentPointsTransactions = await PointsTransaction.findByUser(userId, 5);
    const recentCashbackTransactions = await CashbackTransaction.findByUser(userId, 5);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          loyalty_tier: user.loyalty_tier
        },
        wallet: {
          points_balance: pointsBalance,
          cashback_balance: cashbackBalance,
          pending_commissions: pendingCommissions.length,
          total_pending_amount: pendingCommissions.reduce((sum, comm) => sum + comm.amount, 0)
        },
        recent_transactions: {
          points: recentPointsTransactions,
          cashback: recentCashbackTransactions
        }
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet information'
    });
  }
});

// @route   GET /api/wallets/:userId/transactions
// @desc    Get user wallet transactions
// @access  Private (Manager+)
router.get('/:userId/transactions', [
  verifyToken,
  requireManager,
  query('type').optional().isIn(['points', 'cashback', 'commissions', 'all']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
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

    const { userId } = req.params;
    const { 
      type = 'all', 
      page = 1, 
      limit = 20, 
      start_date, 
      end_date 
    } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const offset = (page - 1) * limit;
    let transactions = [];

    if (type === 'all' || type === 'points') {
      const pointsTransactions = await PointsTransaction.findByUser(userId, parseInt(limit), offset);
      transactions.push(...pointsTransactions.map(t => ({ ...t, transaction_type: 'points' })));
    }

    if (type === 'all' || type === 'cashback') {
      const cashbackTransactions = await CashbackTransaction.findByUser(userId, parseInt(limit), offset);
      transactions.push(...cashbackTransactions.map(t => ({ ...t, transaction_type: 'cashback' })));
    }

    if (type === 'all' || type === 'commissions') {
      const commissionTransactions = await Commission.findByInfluencer(userId, parseInt(limit));
      transactions.push(...commissionTransactions.map(t => ({ ...t, transaction_type: 'commission' })));
    }

    // Sort by date
    transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet transactions'
    });
  }
});

// @route   POST /api/wallets/:userId/points/add
// @desc    Add points to user wallet
// @access  Private (Manager+)
router.post('/:userId/points/add', [
  verifyToken,
  requireManager,
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').isString().withMessage('Reason is required'),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt()
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
    const { amount, reason, reference_type, reference_id } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add points using PointsTransaction model
    await PointsTransaction.addPoints(userId, amount, reason, reference_type, reference_id);

    // Update user's points balance
    await User.updatePointsBalance(userId, amount);

    // Create notification
    const notificationModel = new Notification();
    await notificationModel.create({
      title: 'Points Added',
      message: `${amount} points have been added to your wallet. Reason: ${reason}`,
      type: 'success',
      category: 'points',
      priority: 'normal',
      recipients: [{
        user: userId,
        delivery_status: 'delivered'
      }],
      created_by: userId,
      created_at: new Date()
    });

    res.json({
      success: true,
      message: `${amount} points added successfully`,
      data: {
        user_id: userId,
        amount_added: amount,
        reason
      }
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add points'
    });
  }
});

// @route   POST /api/wallets/:userId/points/deduct
// @desc    Deduct points from user wallet
// @access  Private (Manager+)
router.post('/:userId/points/deduct', [
  verifyToken,
  requireManager,
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').isString().withMessage('Reason is required'),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt()
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
    const { amount, reason, reference_type, reference_id } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has enough points
    const currentBalance = await PointsTransaction.getUserBalance(userId);
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points balance'
      });
    }

    // Deduct points using PointsTransaction model
    await PointsTransaction.spendPoints(userId, amount, reason, reference_type, reference_id);

    // Update user's points balance
    await User.updatePointsBalance(userId, -amount);

    // Create notification
    const notificationModel = new Notification();
    await notificationModel.create({
      title: 'Points Deducted',
      message: `${amount} points have been deducted from your wallet. Reason: ${reason}`,
      type: 'info',
      category: 'points',
      priority: 'normal',
      recipients: [{
        user: userId,
        delivery_status: 'delivered'
      }],
      created_by: userId,
      created_at: new Date()
    });

    res.json({
      success: true,
      message: `${amount} points deducted successfully`,
      data: {
        user_id: userId,
        amount_deducted: amount,
        reason,
        new_balance: currentBalance - amount
      }
    });
  } catch (error) {
    console.error('Deduct points error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deduct points'
    });
  }
});

// @route   POST /api/wallets/:userId/cashback/add
// @desc    Add cashback to user wallet
// @access  Private (Manager+)
router.post('/:userId/cashback/add', [
  verifyToken,
  requireManager,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('reason').isString().withMessage('Reason is required'),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt()
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
    const { amount, reason, reference_type, reference_id } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add cashback using CashbackTransaction model
    const transactionData = {
      user_id: userId,
      amount,
      type: 'bonus',
      status: 'approved',
      reference_type,
      reference_id,
      description: reason,
      created_at: new Date()
    };

    await CashbackTransaction.create(transactionData);

    // Create notification
    const notificationModel = new Notification();
    await notificationModel.create({
      title: 'Cashback Added',
      message: `${amount.toFixed(2)} Kz cashback has been added to your wallet. Reason: ${reason}`,
      type: 'success',
      category: 'points',
      priority: 'normal',
      recipients: [{
        user: userId,
        delivery_status: 'delivered'
      }],
      created_by: userId,
      created_at: new Date()
    });

    res.json({
      success: true,
      message: `${amount.toFixed(2)} Kz cashback added successfully`,
      data: {
        user_id: userId,
        amount_added: amount,
        reason
      }
    });
  } catch (error) {
    console.error('Add cashback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add cashback'
    });
  }
});

// @route   POST /api/wallets/:userId/cashback/withdraw
// @desc    Withdraw cashback from user wallet
// @access  Private (Manager+)
router.post('/:userId/cashback/withdraw', [
  verifyToken,
  requireManager,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('reason').isString().withMessage('Reason is required'),
  body('payment_method').optional().isString(),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt()
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
    const { amount, reason, payment_method, reference_type, reference_id } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has enough cashback
    const currentBalance = await CashbackTransaction.getUserBalance(userId);
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient cashback balance'
      });
    }

    // Create withdrawal transaction using CashbackTransaction model
    const transactionData = {
      user_id: userId,
      amount,
      type: 'withdrawal',
      status: 'pending',
      reference_type,
      reference_id,
      description: reason,
      payment_method,
      created_at: new Date()
    };

    await CashbackTransaction.create(transactionData);

    // Create notification
    const notificationModel = new Notification();
    await notificationModel.create({
      title: 'Cashback Withdrawal',
      message: `${amount.toFixed(2)} Kz cashback withdrawal request submitted. Reason: ${reason}`,
      type: 'info',
      category: 'points',
      priority: 'normal',
      recipients: [{
        user: userId,
        delivery_status: 'delivered'
      }],
      created_by: userId,
      created_at: new Date()
    });

    res.json({
      success: true,
      message: `${amount.toFixed(2)} Kz cashback withdrawal request submitted`,
      data: {
        user_id: userId,
        amount_withdrawn: amount,
        reason,
        payment_method,
        new_balance: currentBalance - amount
      }
    });
  } catch (error) {
    console.error('Withdraw cashback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw cashback'
    });
  }
});

// @route   GET /api/wallets/:userId/balance
// @desc    Get user wallet balance summary
// @access  Private (Manager+)
router.get('/:userId/balance', [verifyToken, requireManager], async (req, res) => {
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

    // Get balances using models
    const pointsBalance = await PointsTransaction.getUserBalance(userId);
    const cashbackBalance = await CashbackTransaction.getUserBalance(userId);
    const pendingCommissions = await Commission.findPending(userId, 100);
    const totalPendingCommissions = pendingCommissions.reduce((sum, comm) => sum + comm.amount, 0);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          loyalty_tier: user.loyalty_tier
        },
        balance: {
          points: pointsBalance,
          cashback: cashbackBalance,
          pending_commissions: totalPendingCommissions,
          total_value: pointsBalance + cashbackBalance + totalPendingCommissions
        }
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance'
    });
  }
});

module.exports = router; 