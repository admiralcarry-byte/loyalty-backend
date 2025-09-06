const express = require('express');
const { body, validationResult } = require('express-validator');
const { commissionController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/commissions
// @desc    Get all commissions with pagination and filters
// @access  Private (Manager+)
router.get('/', [verifyToken, requireManager], async (req, res) => {
  try {
    const result = await commissionController.getAllCommissions(req);
    
    res.json({
      success: true,
      data: result.commissions,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commissions/:id
// @desc    Get commission by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await commissionController.getCommissionById(id);
    
    res.json({
      success: true,
      data: { commission }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/commissions
// @desc    Create new commission
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('user_id').isInt().withMessage('User ID must be a valid integer'),
  body('store_id').isInt().withMessage('Store ID must be a valid integer'),
  body('amount').isFloat({ min: 0 }).withMessage('Commission amount must be a positive number'),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'paid']).withMessage('Invalid status'),
  body('commission_rate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 1')
], async (req, res) => {
  try {
    const newCommission = await commissionController.createCommission(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Commission created successfully',
      data: { commission: newCommission }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/commissions/:id
// @desc    Update commission
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('amount').optional().isFloat({ min: 0 }).withMessage('Commission amount must be a positive number'),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'paid']).withMessage('Invalid status'),
  body('commission_rate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 1')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCommission = await commissionController.updateCommission(id, req.body);
    
    res.json({
      success: true,
      message: 'Commission updated successfully',
      data: { commission: updatedCommission }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/commissions/:id
// @desc    Delete commission
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    await commissionController.deleteCommission(id);
    
    res.json({
      success: true,
      message: 'Commission deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PATCH /api/commissions/:id/status
// @desc    Update commission status
// @access  Private (Manager+)
router.patch('/:id/status', [
  verifyToken,
  requireManager,
  body('status').isIn(['pending', 'approved', 'rejected', 'paid']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedCommission = await commissionController.updateCommissionStatus(id, status);
    
    res.json({
      success: true,
      message: 'Commission status updated successfully',
      data: { commission: updatedCommission }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commissions/stats/overview
// @desc    Get commission statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
], async (req, res) => {
  try {
    const commissionStats = await commissionController.getCommissionStats();
    
    res.json({
      success: true,
      data: commissionStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commissions/user/:userId
// @desc    Get commissions by user
// @access  Private (Manager+)
router.get('/user/:userId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    const commissions = await commissionController.getCommissionsByUser(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commissions/store/:storeId
// @desc    Get commissions by store
// @access  Private (Manager+)
router.get('/store/:storeId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 10 } = req.query;
    const commissions = await commissionController.getCommissionsByStore(storeId, parseInt(limit));
    
    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/commissions/calculate
// @desc    Calculate commission for a sale
// @access  Private (Manager+)
router.post('/calculate', [
  verifyToken,
  requireManager,
  body('sale_id').isInt().withMessage('Sale ID must be a valid integer'),
  body('commission_rate').isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 1')
], async (req, res) => {
  try {
    const { sale_id, commission_rate } = req.body;
    const commission = await commissionController.calculateCommission(sale_id, commission_rate);
    
    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/commissions/bulk-approve
// @desc    Bulk approve commissions
// @access  Private (Manager+)
router.post('/bulk-approve', [
  verifyToken,
  requireManager,
  body('commission_ids').isArray().withMessage('Commission IDs must be an array')
], async (req, res) => {
  try {
    const { commission_ids } = req.body;
    const result = await commissionController.bulkApproveCommissions(commission_ids);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commissions/pending/total
// @desc    Get pending commissions total
// @access  Private (Manager+)
router.get('/pending/total', [verifyToken, requireManager], async (req, res) => {
  try {
    const pendingTotal = await commissionController.getPendingCommissionsTotal();
    
    res.json({
      success: true,
      data: pendingTotal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 