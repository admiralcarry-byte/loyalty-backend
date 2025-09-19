const express = require('express');
const { dashboardController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get main dashboard data
// @access  Private (Manager+)
router.get('/', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const dashboardData = await dashboardController.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/combined
// @desc    Get all dashboard data in one request to reduce API calls
// @access  Private (Manager+)
router.get('/combined', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    // Get all dashboard data in parallel
    const [dashboardData, salesChartData] = await Promise.all([
      dashboardController.getDashboardData(),
      dashboardController.getSalesChartData(period)
    ]);
    
    res.json({
      success: true,
      data: {
        dashboard: dashboardData,
        salesChart: salesChartData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/sales-chart
// @desc    Get sales chart data
// @access  Private (Manager+)
router.get('/sales-chart', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const chartData = await dashboardController.getSalesChartData(period);
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/cashback-config
// @desc    Get cashback settings configuration
// @access  Public (for testing)
router.get('/cashback-config', [], async (req, res) => {
  try {
    // Default cashback settings - in production, these would come from a settings table
    const cashbackSettings = {
      base_cashback_rate: 2.0, // 2% base rate per liter
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
    console.error('Get cashback config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cashback configuration'
    });
  }
});

// @route   GET /api/dashboard/user-registrations
// @desc    Get user registrations chart data
// @access  Private (Manager+)
router.get('/user-registrations', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const chartData = await dashboardController.getUserRegistrationsChartData(period);
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/top-stores
// @desc    Get top performing stores
// @access  Private (Manager+)
router.get('/top-stores', [verifyToken, requireManager], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topStores = await dashboardController.getTopPerformingStores(parseInt(limit));
    
    res.json({
      success: true,
      data: topStores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/top-customers
// @desc    Get top customers
// @access  Private (Manager+)
router.get('/top-customers', [verifyToken, requireManager], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topCustomers = await dashboardController.getTopCustomers(parseInt(limit));
    
    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/loyalty-distribution
// @desc    Get loyalty tier distribution
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/loyalty-distribution', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const distribution = await dashboardController.getLoyaltyTierDistribution();
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/geographical
// @desc    Get geographical distribution
// @access  Private (Manager+)
router.get('/geographical', [verifyToken, requireManager], async (req, res) => {
  try {
    const distribution = await dashboardController.getGeographicalDistribution();
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 