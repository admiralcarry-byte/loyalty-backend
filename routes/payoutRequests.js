const express = require('express');
const { body, validationResult } = require('express-validator');
const { payoutRequestController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payout-requests
// @desc    Get all payout requests with pagination and filters
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/', async (req, res) => {
  try {
    const result = await payoutRequestController.getAllPayoutRequests(req);
    
    res.json({
      success: true,
      data: result.payoutRequests,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/payout-requests/:id
// @desc    Get payout request by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const payoutRequest = await payoutRequestController.getPayoutRequestById(id);
    
    res.json({
      success: true,
      data: { payoutRequest }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/payout-requests
// @desc    Create new payout request
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('user').isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('bank_details.account_name').notEmpty().withMessage('Account name is required'),
  body('bank_details.account_number').notEmpty().withMessage('Account number is required'),
  body('bank_details.bank_name').notEmpty().withMessage('Bank name is required'),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'paid', 'cancelled']).withMessage('Invalid status')
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

    const newPayoutRequest = await payoutRequestController.createPayoutRequest(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Payout request created successfully',
      data: { payoutRequest: newPayoutRequest }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/payout-requests/:id/approve
// @desc    Approve payout request
// @access  Private (Manager+) - Temporarily disabled for testing
router.put('/:id/approve', [
  body('notes').optional().isString().withMessage('Notes must be a string')
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

    const { id } = req.params;
    const { notes = '' } = req.body;
    const approvedBy = req.user?.id || '68bb2a37cee7e3474f45973a'; // Use test user ID if no auth

    const approvedPayoutRequest = await payoutRequestController.approvePayoutRequest(id, approvedBy, notes);
    
    res.json({
      success: true,
      message: 'Payout request approved successfully',
      data: { payoutRequest: approvedPayoutRequest }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/payout-requests/:id/reject
// @desc    Reject payout request
// @access  Private (Manager+)
router.put('/:id/reject', [
  verifyToken,
  requireManager,
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { id } = req.params;
    const { reason = '' } = req.body;
    const rejectedBy = req.user.id; // From auth middleware

    const rejectedPayoutRequest = await payoutRequestController.rejectPayoutRequest(id, rejectedBy, reason);
    
    res.json({
      success: true,
      message: 'Payout request rejected successfully',
      data: { payoutRequest: rejectedPayoutRequest }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/payout-requests/:id/mark-paid
// @desc    Mark payout request as paid
// @access  Private (Manager+)
router.put('/:id/mark-paid', [
  verifyToken,
  requireManager,
  body('payment_details.payment_method').isIn(['bank_transfer', 'mobile_money', 'cash', 'check']).withMessage('Invalid payment method'),
  body('payment_details.payment_reference').optional().isString().withMessage('Payment reference must be a string'),
  body('payment_details.transaction_id').optional().isString().withMessage('Transaction ID must be a string')
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

    const { id } = req.params;
    const { payment_details } = req.body;
    const processedBy = req.user.id; // From auth middleware

    const paidPayoutRequest = await payoutRequestController.markAsPaid(id, payment_details, processedBy);
    
    res.json({
      success: true,
      message: 'Payout request marked as paid successfully',
      data: { payoutRequest: paidPayoutRequest }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/payout-requests/stats/overview
// @desc    Get payout request statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
], async (req, res) => {
  try {
    const payoutStats = await payoutRequestController.getPayoutStats();
    
    res.json({
      success: true,
      data: payoutStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/payout-requests/pending/list
// @desc    Get pending payout requests
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/pending/list', async (req, res) => {
  try {
    const pendingRequests = await payoutRequestController.getPendingPayoutRequests();
    
    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/payout-requests/user/:userId
// @desc    Get payout requests by user
// @access  Private (Manager+)
router.get('/user/:userId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    const userPayoutRequests = await payoutRequestController.getPayoutRequestsByUser(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: userPayoutRequests
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;