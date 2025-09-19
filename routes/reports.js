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
  Notification,
  AuditLog
} = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

// @route   GET /api/reports/overview
// @desc    Get overview report data
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/overview', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // Use dashboard controller for consistent data
    const dashboardController = require('../controllers/dashboardController');
    const dashboardData = await dashboardController.getDashboardData();
    
    // Transform dashboard data to reports format
    // Generate monthly stats for the last 6 months using real data
    const currentDate = new Date();
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Query real sales data for this month
      const saleModel = new Sale();
      const salesData = await saleModel.model.aggregate([
        {
          $match: {
            $or: [
              { createdAt: { $gte: date, $lt: nextMonth } },
              { created_at: { $gte: date, $lt: nextMonth } }
            ],
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total_amount' },
            salesCount: { $sum: 1 },
            totalCommission: { $sum: '$commission.amount' },
            totalCashback: { $sum: '$cashback_earned' }
          }
        }
      ]);
      
      // Query real user registrations for this month
      const userModel = new User();
      const usersData = await userModel.model.aggregate([
        {
          $match: {
            $or: [
              { createdAt: { $gte: date, $lt: nextMonth } },
              { created_at: { $gte: date, $lt: nextMonth } }
            ],
            role: { $in: ['user', 'customer', 'influencer'] }
          }
        },
        {
          $group: {
            _id: null,
            userCount: { $sum: 1 }
          }
        }
      ]);
      
      // Commission data is already included in sales data (Commission table removed)
      const sales = salesData[0] || { totalSales: 0, salesCount: 0, totalCommission: 0, totalCashback: 0 };
      const users = usersData[0] || { userCount: 0 };
      
      monthlyStats.push({
        month: monthName,
        sales: Math.floor(sales.totalSales || 0),
        users: users.userCount || 0,
        commission: Math.floor(sales.totalCommission || 0),
        revenue: Math.floor(sales.totalSales || 0),
        cashback: Math.floor(sales.totalCashback || 0)
      });
    }
    const tierDistribution = [
      { name: "Lead", value: dashboardData.userStats.loyaltyDistribution.lead, color: "hsl(var(--accent))" },
      { name: "Silver", value: dashboardData.userStats.loyaltyDistribution.silver, color: "hsl(var(--loyalty-silver))" },
      { name: "Gold", value: dashboardData.userStats.loyaltyDistribution.gold, color: "hsl(var(--loyalty-gold))" },
      { name: "Platinum", value: dashboardData.userStats.loyaltyDistribution.platinum, color: "hsl(var(--loyalty-platinum))" }
    ];
    const topInfluencers = (dashboardData.commissionStats?.topInfluencers || []).map(influencer => ({
      name: influencer.name,
      network: influencer.network,
      sales: `$${(influencer.commission || 0).toLocaleString()}`,
      commission: `$${(influencer.commission || 0).toLocaleString()}`,
      tier: influencer.tier
    }));
    
    res.json({
      success: true,
      data: {
        monthlyStats,
        tierDistribution,
        topInfluencers
      }
    });
  } catch (error) {
    console.error('Reports overview error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// @route   GET /api/reports/loyalty
// @desc    Get loyalty report data
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/loyalty', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // Use dashboard controller for consistent data
    const dashboardController = require('../controllers/dashboardController');
    const dashboardData = await dashboardController.getDashboardData();
    
    const tierDistribution = [
      { name: "Lead", value: dashboardData.userStats.loyaltyDistribution.lead, color: "hsl(var(--accent))" },
      { name: "Silver", value: dashboardData.userStats.loyaltyDistribution.silver, color: "hsl(var(--loyalty-silver))" },
      { name: "Gold", value: dashboardData.userStats.loyaltyDistribution.gold, color: "hsl(var(--loyalty-gold))" },
      { name: "Platinum", value: dashboardData.userStats.loyaltyDistribution.platinum, color: "hsl(var(--loyalty-platinum))" }
    ];
    
    res.json({
      success: true,
      data: {
        tierDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/reports/influencers
// @desc    Get influencer report data
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/influencers', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // Use dashboard controller for consistent data
    const dashboardController = require('../controllers/dashboardController');
    const dashboardData = await dashboardController.getDashboardData();
    
    const topInfluencers = (dashboardData.commissionStats?.topInfluencers || []).map(influencer => ({
      name: influencer.name,
      network: influencer.network,
      sales: `$${(influencer.commission || 0).toLocaleString()}`,
      commission: `$${(influencer.commission || 0).toLocaleString()}`,
      tier: influencer.tier
    }));
    
    res.json({
      success: true,
      data: {
        topInfluencers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/reports/sales
// @desc    Generate sales reports
// @access  Private (Manager+)
router.get('/sales', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('group_by').optional().isIn(['day', 'week', 'month', 'year']),
  query('store_id').optional().isInt(),
  query('user_id').optional().isInt(),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { 
      start_date, 
      end_date, 
      group_by = 'day', 
      store_id, 
      user_id, 
      format = 'json' 
    } = req.query;

    // Get sales analytics using Sale model
    const salesAnalytics = await Sale.getDashboardAnalytics(start_date, end_date, group_by, store_id);

    // Get top performing stores
    const topStores = await Sale.getTopStores(start_date, end_date, 10);

    // Get top customers
    const topCustomers = await Sale.getTopCustomers(start_date, end_date, 10);

    // Get payment method statistics
    const paymentStats = await Sale.getPaymentMethodStats(start_date, end_date);

    // Get daily sales
    const dailySales = await Sale.getDailySales(start_date, end_date);

    // Get monthly sales
    const monthlySales = await Sale.getMonthlySales(start_date, end_date);

    const reportData = {
      summary: salesAnalytics,
      topStores,
      topCustomers,
      paymentMethods: paymentStats,
      dailySales,
      monthlySales,
      filters: {
        start_date,
        end_date,
        group_by,
        store_id,
        user_id
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales report'
    });
  }
});

// @route   GET /api/reports/users
// @desc    Generate user reports
// @access  Private (Manager+)
router.get('/users', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('role').optional().isIn(['customer', 'influencer', 'admin', 'manager', 'staff']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('loyalty_tier').optional().isIn(['lead', 'silver', 'gold', 'platinum']),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { 
      start_date, 
      end_date, 
      role, 
      status, 
      loyalty_tier, 
      format = 'json' 
    } = req.query;

    // Get user statistics using User model
    const userStats = await User.getUserStats(start_date, end_date);

    // Get top customers by purchases
    const topCustomers = await User.getTopCustomers(start_date, end_date, 10);

    // Get top customers by liters
    const topLitersCustomers = await User.getTopLitersCustomers(start_date, end_date, 10);

    // Get users with referrals
    const usersWithReferrals = await User.getUsersWithReferrals(start_date, end_date);

    // Get recently active users
    const recentlyActiveUsers = await User.getRecentlyActiveUsers(30, 10);

    // Get users by date range
    const usersByDateRange = await User.getUsersByDateRange(start_date, end_date);

    const reportData = {
      summary: userStats,
      topCustomers,
      topLitersCustomers,
      usersWithReferrals,
      recentlyActiveUsers,
      usersByDateRange,
      filters: {
        start_date,
        end_date,
        role,
        status,
        loyalty_tier
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Users report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate users report'
    });
  }
});

// @route   GET /api/reports/products
// @desc    Generate product reports
// @access  Private (Manager+)
router.get('/products', [
  verifyToken,
  requireManager,
  query('category').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'discontinued']),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { category, status, format = 'json' } = req.query;

    // Get product statistics using Product model
    const productStats = await Product.getProductStats();

    // Get top selling products
    const topSellingProducts = await Product.getTopSellingProducts(10);

    // Get low stock products
    const lowStockProducts = await Product.getLowStockProducts(20);

    // Get products needing restock
    const productsNeedingRestock = await Product.getProductsNeedingRestock();

    // Get inventory value
    const inventoryValue = await Product.getInventoryValue();

    // Get product performance
    const productPerformance = await Product.getProductPerformance();

    const reportData = {
      summary: productStats,
      topSelling: topSellingProducts,
      lowStock: lowStockProducts,
      needingRestock: productsNeedingRestock,
      inventoryValue,
      productPerformance,
      filters: {
        category,
        status
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Products report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate products report'
    });
  }
});

// @route   GET /api/reports/loyalty
// @desc    Generate loyalty program reports
// @access  Private (Manager+)
router.get('/loyalty', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { start_date, end_date, format = 'json' } = req.query;

    // Get points statistics using PointsTransaction model
    const pointsStats = await PointsTransaction.getPointsStats(start_date, end_date);

    // Get top points earners
    const topPointsEarners = await PointsTransaction.getTopPointsEarners(10, start_date, end_date);

    // Get cashback statistics using CashbackTransaction model
    const cashbackStats = await CashbackTransaction.getCashbackStats(start_date, end_date);

    // Get top cashback earners
    const topCashbackEarners = await CashbackTransaction.getTopCashbackEarners(10, start_date, end_date);

    // Get commission statistics from dashboard controller
    const dashboardController = new DashboardController();
    const commissionStats = await dashboardController.getCommissionStats();

    // Get top earning influencers from commission stats
    const topEarningInfluencers = commissionStats.topInfluencers || [];

    const reportData = {
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
      },
      filters: {
        start_date,
        end_date
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=loyalty-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Loyalty report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate loyalty report'
    });
  }
});

// @route   GET /api/reports/stores
// @desc    Generate store reports
// @access  Private (Manager+)
router.get('/stores', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('city').optional().isString(),
  query('state').optional().isString(),
  query('status').optional().isIn(['active', 'inactive']),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { start_date, end_date, city, state, status, format = 'json' } = req.query;

    // Get store statistics using Store model
    const storeStats = await Store.getStoreStats(start_date, end_date);

    // Get stores by performance
    const storesByPerformance = await Store.getStoresByPerformance(start_date, end_date, 10);

    // Get stores by city with performance
    const storesByCity = await Store.getStoresByCityWithPerformance(start_date, end_date);

    // Get store distribution by state
    const storeDistributionByState = await Store.getStoreDistributionByState();

    // Get store distribution by city
    const storeDistributionByCity = await Store.getStoreDistributionByCity();

    const reportData = {
      summary: storeStats,
      topPerforming: storesByPerformance,
      byCity: storesByCity,
      distributionByState: storeDistributionByState,
      distributionByCity: storeDistributionByCity,
      filters: {
        start_date,
        end_date,
        city,
        state,
        status
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stores-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Stores report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate stores report'
    });
  }
});

// @route   GET /api/reports/campaigns
// @desc    Generate campaign reports
// @access  Private (Manager+)
router.get('/campaigns', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('type').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'expired']),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { start_date, end_date, type, status, format = 'json' } = req.query;

    // Get campaign statistics using Campaign model
    const campaignStats = await Campaign.getCampaignStats(start_date, end_date);

    // Get campaigns by performance
    const campaignsByPerformance = await Campaign.getCampaignsByPerformance(start_date, end_date, 10);

    // Get campaigns ending soon
    const campaignsEndingSoon = await Campaign.getCampaignsEndingSoon(10);

    // Get campaigns starting soon
    const campaignsStartingSoon = await Campaign.getCampaignsStartingSoon(10);

    const reportData = {
      summary: campaignStats,
      topPerforming: campaignsByPerformance,
      endingSoon: campaignsEndingSoon,
      startingSoon: campaignsStartingSoon,
      filters: {
        start_date,
        end_date,
        type,
        status
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=campaigns-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Campaigns report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate campaigns report'
    });
  }
});

// @route   GET /api/reports/audit
// @desc    Generate audit reports
// @access  Private (Manager+)
router.get('/audit', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('user_id').optional().isInt(),
  query('action').optional().isString(),
  query('table_name').optional().isString(),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { start_date, end_date, user_id, action, table_name, format = 'json' } = req.query;

    // Get activity summary using AuditLog model
    const activitySummary = await AuditLog.getActivitySummary(start_date, end_date);

    // Get actions summary
    const actionsSummary = await AuditLog.getActionsSummary(start_date, end_date);

    // Get tables summary
    const tablesSummary = await AuditLog.getTablesSummary(start_date, end_date);

    // Get users activity summary
    const usersSummary = await AuditLog.getUsersActivitySummary(start_date, end_date, 10);

    const reportData = {
      activitySummary,
      actionsSummary,
      tablesSummary,
      usersSummary,
      filters: {
        start_date,
        end_date,
        user_id,
        action,
        table_name
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Audit report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audit report'
    });
  }
});

// @route   GET /api/reports/comprehensive
// @desc    Generate comprehensive business report
// @access  Private (Manager+)
router.get('/comprehensive', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
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

    const { start_date, end_date, format = 'json' } = req.query;

    // Get all statistics from different models
    const userStats = await User.getUserStats(start_date, end_date);
    const salesStats = await Sale.getSalesStats(start_date, end_date);
    const productStats = await Product.getProductStats();
    const storeStats = await Store.getStoreStats(start_date, end_date);
    const pointsStats = await PointsTransaction.getPointsStats(start_date, end_date);
    const cashbackStats = await CashbackTransaction.getCashbackStats(start_date, end_date);
    // Get commission statistics from dashboard controller
    const dashboardController = new DashboardController();
    const commissionStats = await dashboardController.getCommissionStats();
    const onlinePurchaseStats = await OnlinePurchase.getOnlinePurchaseStats(start_date, end_date);
    const purchaseEntryStats = await PurchaseEntry.getEntryStats(start_date, end_date);
    const campaignStats = await Campaign.getCampaignStats(start_date, end_date);
    const notificationStats = await Notification.getNotificationStats(start_date, end_date);

    const reportData = {
      business_overview: {
        users: userStats,
        sales: salesStats,
        products: productStats,
        stores: storeStats
      },
      loyalty_program: {
        points: pointsStats,
        cashback: cashbackStats,
        commissions: commissionStats
      },
      operations: {
        onlinePurchases: onlinePurchaseStats,
        purchaseEntries: purchaseEntryStats,
        campaigns: campaignStats,
        notifications: notificationStats
      },
      filters: {
        start_date,
        end_date
      },
      generated_at: new Date()
    };

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=comprehensive-report.csv');
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Comprehensive report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive report'
    });
  }
});

// Helper function to convert data to CSV format
function convertToCSV(data) {
  // This is a simplified CSV conversion
  // In a real implementation, you might want to use a library like 'json2csv'
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    return flattened;
  };

  const flattened = flattenObject(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened);
  
  return headers.join(',') + '\n' + values.join(',');
}

module.exports = router; 