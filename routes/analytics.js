const express = require('express');
const { query, validationResult } = require('express-validator');
const { 
  User, 
  Sale, 
  Product, 
  Store, 
  PointsTransaction, 
  CashbackTransaction, 
  OnlinePurchase,
  PurchaseEntry,
  Campaign,
  Notification
} = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics overview
// @access  Private (Manager+)
router.get('/dashboard', [verifyToken, requireManager], async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get user statistics
    const userStats = await User.getUserStats(start_date, end_date);

    // Get sales statistics
    const salesStats = await Sale.getSalesStats(start_date, end_date);

    // Get product statistics
    const productStats = await Product.getProductStats();

    // Get store statistics
    const storeStats = await Store.getStoreStats();

    // Get points statistics
    const pointsStats = await PointsTransaction.getPointsStats(start_date, end_date);

    // Get cashback statistics
    const cashbackStats = await CashbackTransaction.getCashbackStats(start_date, end_date);

    // Get commission statistics from dashboard controller
    const dashboardController = new DashboardController();
    const commissionStats = await dashboardController.getCommissionStats();

    // Get online purchase statistics
    const onlinePurchaseStats = await OnlinePurchase.getOnlinePurchaseStats(start_date, end_date);

    // Get purchase entry statistics
    const purchaseEntryStats = await PurchaseEntry.getEntryStats(start_date, end_date);

    // Get campaign statistics
    const campaignStats = await Campaign.getCampaignStats(start_date, end_date);

    // Get notification statistics
    const notificationStats = await Notification.getNotificationStats(start_date, end_date);

    res.json({
      success: true,
      data: {
        users: userStats,
        sales: salesStats,
        products: productStats,
        stores: storeStats,
        points: pointsStats,
        cashback: cashbackStats,
        commissions: commissionStats,
        onlinePurchases: onlinePurchaseStats,
        purchaseEntries: purchaseEntryStats,
        campaigns: campaignStats,
        notifications: notificationStats
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/sales
// @desc    Get sales analytics
// @access  Private (Manager+)
router.get('/sales', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('group_by').optional().isIn(['day', 'week', 'month', 'year']),
  query('store_id').optional().isInt()
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

    const { start_date, end_date, group_by = 'day', store_id } = req.query;

    // Get sales analytics using Sale model
    const salesAnalytics = await Sale.getDashboardAnalytics(start_date, end_date, group_by, store_id);

    // Get top performing stores
    const topStores = await Sale.getTopStores(start_date, end_date, 10);

    // Get top customers
    const topCustomers = await Sale.getTopCustomers(start_date, end_date, 10);

    // Get payment method statistics
    const paymentStats = await Sale.getPaymentMethodStats(start_date, end_date);

    res.json({
      success: true,
      data: {
        analytics: salesAnalytics,
        topStores,
        topCustomers,
        paymentMethods: paymentStats
      }
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales analytics'
    });
  }
});

// @route   GET /api/analytics/users
// @desc    Get user analytics
// @access  Private (Manager+)
router.get('/users', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('group_by').optional().isIn(['day', 'week', 'month', 'year'])
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

    const { start_date, end_date, group_by = 'day' } = req.query;

    // Get user registration analytics
    const userAnalytics = await User.getUserStats(start_date, end_date, group_by);

    // Get top customers by purchases
    const topCustomers = await User.getTopCustomers(start_date, end_date, 10);

    // Get top customers by liters
    const topLitersCustomers = await User.getTopLitersCustomers(start_date, end_date, 10);

    // Get users with referrals
    const usersWithReferrals = await User.getUsersWithReferrals(start_date, end_date);

    // Get recently active users
    const recentlyActiveUsers = await User.getRecentlyActiveUsers(30, 10);

    res.json({
      success: true,
      data: {
        analytics: userAnalytics,
        topCustomers,
        topLitersCustomers,
        usersWithReferrals,
        recentlyActiveUsers
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user analytics'
    });
  }
});

// @route   GET /api/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (Manager+)
router.get('/revenue', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('group_by').optional().isIn(['day', 'week', 'month', 'year'])
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

    const { start_date, end_date, group_by = 'month' } = req.query;

    // Get revenue statistics
    const revenueStats = await Sale.getRevenueStats(start_date, end_date, group_by);

    // Get revenue by source
    const revenueBySource = await Sale.getRevenueBySource(start_date, end_date);

    // Get revenue trends
    const revenueTrends = await Sale.getRevenueTrends(start_date, end_date, group_by);

    res.json({
      success: true,
      data: {
        revenueStats,
        revenueBySource,
        revenueTrends
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue analytics'
    });
  }
});

// @route   GET /api/analytics/products
// @desc    Get product analytics
// @access  Private (Manager+)
router.get('/products', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get product statistics
    const productStats = await Product.getProductStats(start_date, end_date);

    // Get top selling products
    const topSellingProducts = await Product.getTopSellingProducts(10, start_date, end_date);

    // Get low stock products
    const lowStockProducts = await Product.getLowStockProducts(20);

    // Get products needing restock
    const productsNeedingRestock = await Product.getProductsNeedingRestock();

    // Get inventory value
    const inventoryValue = await Product.getInventoryValue();

    res.json({
      success: true,
      data: {
        statistics: productStats,
        topSelling: topSellingProducts,
        lowStock: lowStockProducts,
        needingRestock: productsNeedingRestock,
        inventoryValue
      }
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product analytics'
    });
  }
});

// @route   GET /api/analytics/stores
// @desc    Get store analytics
// @access  Private (Manager+)
router.get('/stores', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get store statistics
    const storeStats = await Store.getStoreStats(start_date, end_date);

    // Get stores by performance
    const storesByPerformance = await Store.getStoresByPerformance(start_date, end_date, 10);

    // Get stores by city with performance
    const storesByCity = await Store.getStoresByCityWithPerformance(start_date, end_date);

    // Get store distribution by state
    const storeDistributionByState = await Store.getStoreDistributionByState();

    // Get store distribution by city
    const storeDistributionByCity = await Store.getStoreDistributionByCity();

    res.json({
      success: true,
      data: {
        statistics: storeStats,
        topPerforming: storesByPerformance,
        byCity: storesByCity,
        distributionByState: storeDistributionByState,
        distributionByCity: storeDistributionByCity
      }
    });
  } catch (error) {
    console.error('Store analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get store analytics'
    });
  }
});

// @route   GET /api/analytics/loyalty
// @desc    Get loyalty program analytics
// @access  Private (Manager+)
router.get('/loyalty', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get points statistics
    const pointsStats = await PointsTransaction.getPointsStats(start_date, end_date);

    // Get top points earners
    const topPointsEarners = await PointsTransaction.getTopPointsEarners(10, start_date, end_date);

    // Get cashback statistics
    const cashbackStats = await CashbackTransaction.getCashbackStats(start_date, end_date);

    // Get top cashback earners
    const topCashbackEarners = await CashbackTransaction.getTopCashbackEarners(10, start_date, end_date);

    // Get commission statistics from dashboard controller
    const dashboardController = new DashboardController();
    const commissionStats = await dashboardController.getCommissionStats();

    // Get top earning influencers from commission stats
    const topEarningInfluencers = commissionStats.topInfluencers || [];

    res.json({
      success: true,
      data: {
        points: {
          statistics: pointsStats,
          topEarners: topPointsEarners
        },
        cashback: {
          statistics: cashbackStats,
          topEarners: topCashbackEarners
        },
        commissions: {
          statistics: commissionStats,
          topEarners: topEarningInfluencers
        }
      }
    });
  } catch (error) {
    console.error('Loyalty analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get loyalty analytics'
    });
  }
});

// @route   GET /api/analytics/campaigns
// @desc    Get campaign analytics
// @access  Private (Manager+)
router.get('/campaigns', [
  verifyToken,
  requireManager,
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

    const { start_date, end_date } = req.query;

    // Get campaign statistics
    const campaignStats = await Campaign.getCampaignStats(start_date, end_date);

    // Get campaigns by performance
    const campaignsByPerformance = await Campaign.getCampaignsByPerformance(start_date, end_date, 10);

    // Get campaigns ending soon
    const campaignsEndingSoon = await Campaign.getCampaignsEndingSoon(10);

    // Get campaigns starting soon
    const campaignsStartingSoon = await Campaign.getCampaignsStartingSoon(10);

    res.json({
      success: true,
      data: {
        statistics: campaignStats,
        topPerforming: campaignsByPerformance,
        endingSoon: campaignsEndingSoon,
        startingSoon: campaignsStartingSoon
      }
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get campaign analytics'
    });
  }
});

// @route   GET /api/analytics/performance
// @desc    Get performance comparison analytics
// @access  Private (Manager+)
router.get('/performance', [
  verifyToken,
  requireManager,
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('compare_with').optional().isIn(['previous', 'same_period_last_year'])
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

    const { period = 'month', compare_with = 'previous' } = req.query;

    // Get sales performance comparison
    const salesPerformance = await Sale.getPerformanceComparison(period, compare_with);

    // Get user growth comparison
    const userGrowth = await User.getUserStats(null, null, period);

    // Get points performance comparison
    const pointsPerformance = await PointsTransaction.getPointsStats(null, null, period);

    // Get cashback performance comparison
    const cashbackPerformance = await CashbackTransaction.getCashbackStats(null, null, period);

    res.json({
      success: true,
      data: {
        sales: salesPerformance,
        users: userGrowth,
        points: pointsPerformance,
        cashback: cashbackPerformance,
        period,
        compareWith: compare_with
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance analytics'
    });
  }
});

module.exports = router; 