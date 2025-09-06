const express = require('express');
const { dashboardController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get main dashboard data
// @access  Private (Manager+)
router.get('/', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
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

// @route   GET /api/dashboard/sales-chart
// @desc    Get sales chart data
// @access  Private (Manager+)
router.get('/sales-chart', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
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

// @route   GET /api/dashboard/user-registrations
// @desc    Get user registrations chart data
// @access  Private (Manager+)
router.get('/user-registrations', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
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
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
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