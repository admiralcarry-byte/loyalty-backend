const express = require('express');
const { body, validationResult } = require('express-validator');
const { commissionSettingsController } = require('../controllers');
const { verifyToken, requireAdmin, requireManager } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Validation middleware for saving settings
const validateCommissionSettings = [
  body('base_commission_rate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Base commission rate must be between 0 and 100'),
  
  body('tier_multipliers.lead')
    .isFloat({ min: 0 })
    .withMessage('Lead tier multiplier must be a positive number'),
  
  body('tier_multipliers.silver')
    .isFloat({ min: 0 })
    .withMessage('Silver tier multiplier must be a positive number'),
  
  body('tier_multipliers.gold')
    .isFloat({ min: 0 })
    .withMessage('Gold tier multiplier must be a positive number'),
  
  body('tier_multipliers.platinum')
    .isFloat({ min: 0 })
    .withMessage('Platinum tier multiplier must be a positive number'),
  
  body('minimum_active_users')
    .isInt({ min: 0 })
    .withMessage('Minimum active users must be a non-negative integer'),
  
  body('payout_threshold')
    .isFloat({ min: 0 })
    .withMessage('Payout threshold must be a positive number'),
  
  body('payout_frequency')
    .isIn(['weekly', 'monthly', 'quarterly'])
    .withMessage('Payout frequency must be weekly, monthly, or quarterly'),
  
  body('auto_approval')
    .isBoolean()
    .withMessage('Auto approval must be a boolean value'),
  
  body('commission_cap')
    .isFloat({ min: 0 })
    .withMessage('Commission cap must be a positive number')
];

// @route   GET /api/commission-settings
// @desc    Get current commission settings
// @access  Private (Admin/Manager)
router.get('/', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    await commissionSettingsController.getCurrentSettings(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/commission-settings
// @desc    Save new commission settings
// @access  Private (Admin only)
router.post('/', [
  verifyToken,  // Re-enabled authentication
  requireAdmin,  // Re-enabled authorization
  ...validateCommissionSettings
], async (req, res) => {
  try {
    await commissionSettingsController.saveSettings(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commission-settings/history
// @desc    Get commission settings history
// @access  Private (Admin/Manager)
router.get('/history', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    await commissionSettingsController.getSettingsHistory(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/commission-settings/calculate
// @desc    Calculate commission for testing
// @access  Private (Admin/Manager)
router.post('/calculate', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
  body('tier')
    .isIn(['lead', 'silver', 'gold', 'platinum'])
    .withMessage('Tier must be lead, silver, gold, or platinum'),
  body('sales_amount')
    .isFloat({ min: 0 })
    .withMessage('Sales amount must be a positive number')
], async (req, res) => {
  try {
    await commissionSettingsController.calculateCommission(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/commission-settings/stats
// @desc    Get commission statistics for dashboard
// @access  Private (Manager+)
router.get('/stats', [verifyToken, requireManager], async (req, res) => {
  try {
    const dashboardController = new DashboardController();
    const commissionStats = await dashboardController.getCommissionStats();
    
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

module.exports = router;