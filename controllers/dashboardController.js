const { User, Store, Sale, Campaign } = require('../models');
const PercentageCalculator = require('../utils/percentageCalculator');

class DashboardController {
  constructor() {
    this.userModel = new User();
    this.storeModel = new Store();
    this.saleModel = new Sale();
    this.campaignModel = new Campaign();
  }
  // Get main dashboard data
  async getDashboardData() {
    try {
      const [userStats, storeStats, salesStats, commissionStats, campaignStats] = await Promise.all([
        this.getUserStats(),
        this.getStoreStats(),
        this.getSalesStats(),
        this.getCommissionStats(),
        this.getCampaignStats()
      ]);
      
      return {
        userStats,
        storeStats,
        salesStats,
        commissionStats,
        campaignStats,
        recentActivity: await this.getRecentActivity()
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  // Get user statistics (excluding staff - admins and managers)
  async getUserStats() {
    try {
      // Define customer roles (exclude staff)
      const customerRoles = ['user', 'customer', 'influencer'];
      const staffRoles = ['admin', 'manager', 'staff'];
      
      // Get date ranges for comparison
      const dateRanges = PercentageCalculator.getDateRanges();
      
      // Get total customers (excluding staff)
      const totalUsers = await this.userModel.model.countDocuments({ 
        role: { $in: customerRoles } 
      });
      
      // Get active customers (excluding staff)
      const activeUsers = await this.userModel.model.countDocuments({ 
        status: 'active',
        role: { $in: customerRoles }
      });
      
      // Get customers by loyalty tier (excluding staff)
      const leadUsers = await this.userModel.model.countDocuments({ 
        loyalty_tier: 'lead',
        role: { $in: customerRoles }
      });
      const silverUsers = await this.userModel.model.countDocuments({ 
        loyalty_tier: 'silver',
        role: { $in: customerRoles }
      });
      const goldUsers = await this.userModel.model.countDocuments({ 
        loyalty_tier: 'gold',
        role: { $in: customerRoles }
      });
      const platinumUsers = await this.userModel.model.countDocuments({ 
        loyalty_tier: 'platinum',
        role: { $in: customerRoles }
      });
      
      // Get recent customers (current month, excluding staff)
      const newUsersThisMonth = await this.userModel.model.countDocuments({ 
        created_at: { 
          $gte: dateRanges.currentMonth.start,
          $lte: dateRanges.currentMonth.end
        },
        role: { $in: customerRoles }
      });
      
      // Get previous month users for comparison
      const newUsersPreviousMonth = await this.userModel.model.countDocuments({ 
        created_at: { 
          $gte: dateRanges.previousMonth.start,
          $lte: dateRanges.previousMonth.end
        },
        role: { $in: customerRoles }
      });
      
      // Get today's users
      const newUsersToday = await this.userModel.model.countDocuments({ 
        created_at: { 
          $gte: dateRanges.today.start,
          $lte: dateRanges.today.end
        },
        role: { $in: customerRoles }
      });
      
      // Get this week's users
      const newUsersThisWeek = await this.userModel.model.countDocuments({ 
        created_at: { 
          $gte: dateRanges.currentWeek.start,
          $lte: dateRanges.currentWeek.end
        },
        role: { $in: customerRoles }
      });
      
      // Calculate growth percentages
      const userGrowthPercentage = PercentageCalculator.calculateMonthOverMonth(
        newUsersThisMonth, 
        newUsersPreviousMonth
      );
      
      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthPercentage: PercentageCalculator.formatPercentage(userGrowthPercentage),
        loyaltyDistribution: {
          lead: leadUsers,
          silver: silverUsers,
          gold: goldUsers,
          platinum: platinumUsers
        }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        userGrowthPercentage: '0.0',
        loyaltyDistribution: {
          lead: 0,
          silver: 0,
          gold: 0,
          platinum: 0
        }
      };
    }
  }

  // Get store statistics
  async getStoreStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const stats = await this.storeModel.model.aggregate([
        {
          $group: {
            _id: null,
            total_stores: { $sum: 1 },
            active_stores: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive_stores: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
            maintenance_stores: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
            closed_stores: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
            total_cities: { $addToSet: '$city' },
            total_countries: { $addToSet: '$country' },
            new_stores_today: { $sum: { $cond: [{ $gte: ['$created_at', today] }, 1, 0] } },
            new_stores_week: { $sum: { $cond: [{ $gte: ['$created_at', weekAgo] }, 1, 0] } },
            new_stores_month: { $sum: { $cond: [{ $gte: ['$created_at', monthAgo] }, 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            total_stores: 1,
            active_stores: 1,
            inactive_stores: 1,
            maintenance_stores: 1,
            closed_stores: 1,
            total_cities: { $size: '$total_cities' },
            total_countries: { $size: '$total_countries' },
            new_stores_today: 1,
            new_stores_week: 1,
            new_stores_month: 1
          }
        }
      ]);

      const result = stats[0] || {};
      
      // Get total sales from all stores
      const totalSales = await this.saleModel.model.aggregate([
        {
          $group: {
            _id: null,
            total_sales: { $sum: 1 }
          }
        }
      ]);

      const salesCount = totalSales[0]?.total_sales || 0;
      const averageSalesPerStore = result.total_stores > 0 ? (salesCount / result.total_stores) : 0;

      return {
        totalStores: result.total_stores || 0,
        activeStores: result.active_stores || 0,
        totalSales: salesCount,
        averageSalesPerStore: Math.round(averageSalesPerStore * 100) / 100
      };
    } catch (error) {
      console.error('Error getting store stats:', error);
      return {
        totalStores: 0,
        activeStores: 0,
        totalSales: 0,
        averageSalesPerStore: 0
      };
    }
  }

  // Get sales statistics
  async getSalesStats() {
    try {
      const dateRanges = PercentageCalculator.getDateRanges();
      
      // Get current month stats
      const currentMonthStats = await this.saleModel.model.aggregate([
        {
          $match: {
            created_at: {
              $gte: dateRanges.currentMonth.start,
              $lte: dateRanges.currentMonth.end
            }
          }
        },
        {
          $group: {
            _id: null,
            sales_count: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            avg_sale_amount: { $avg: '$total_amount' }
          }
        }
      ]);

      // Get previous month stats
      const previousMonthStats = await this.saleModel.model.aggregate([
        {
          $match: {
            created_at: {
              $gte: dateRanges.previousMonth.start,
              $lte: dateRanges.previousMonth.end
            }
          }
        },
        {
          $group: {
            _id: null,
            sales_count: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            avg_sale_amount: { $avg: '$total_amount' }
          }
        }
      ]);

      // Get overall stats
      const overallStats = await this.saleModel.model.aggregate([
        {
          $group: {
            _id: null,
            total_sales: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            total_liters: { $sum: '$total_liters' }, // Use total_liters field from schema
            avg_sale_amount: { $avg: '$total_amount' },
            unique_customers: { $addToSet: '$user_id' },
            stores_with_sales: { $addToSet: '$store_id' }
          }
        },
        {
          $project: {
            _id: 0,
            total_sales: 1,
            total_revenue: 1,
            total_liters: 1,
            avg_sale_amount: 1,
            unique_customers: { $size: '$unique_customers' },
            stores_with_sales: { $size: '$stores_with_sales' }
          }
        }
      ]);

      const currentMonth = currentMonthStats[0] || { sales_count: 0, total_revenue: 0, avg_sale_amount: 0 };
      const previousMonth = previousMonthStats[0] || { sales_count: 0, total_revenue: 0, avg_sale_amount: 0 };
      const overall = overallStats[0] || {};

      // Calculate growth percentages
      const salesGrowthPercentage = PercentageCalculator.calculateMonthOverMonth(
        currentMonth.sales_count,
        previousMonth.sales_count
      );

      const revenueGrowthPercentage = PercentageCalculator.calculateMonthOverMonth(
        currentMonth.total_revenue,
        previousMonth.total_revenue
      );

      return {
        totalLiters: overall.total_liters || 0,
        totalRevenue: overall.total_revenue || 0,
        averageOrderValue: overall.avg_sale_amount || 0,
        salesGrowth: PercentageCalculator.formatPercentage(salesGrowthPercentage),
        revenueGrowth: PercentageCalculator.formatPercentage(revenueGrowthPercentage),
        currentMonthSales: currentMonth.sales_count,
        previousMonthSales: previousMonth.sales_count,
        currentMonthRevenue: currentMonth.total_revenue,
        previousMonthRevenue: previousMonth.total_revenue
      };
    } catch (error) {
      console.error('Error getting sales stats:', error);
      return {
        totalLiters: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        salesGrowth: '0.0',
        revenueGrowth: '0.0',
        currentMonthSales: 0,
        previousMonthSales: 0,
        currentMonthRevenue: 0,
        previousMonthRevenue: 0
      };
    }
  }

  // Get commission statistics from sales table only
  async getCommissionStats() {
    try {
      // Get commission settings for calculation
      const CommissionSettings = require('../models/CommissionSettings');
      const commissionSettingsModel = new CommissionSettings();
      const settings = await commissionSettingsModel.model.findOne({});
      
      // Default commission settings if none found
      const defaultSettings = {
        base_commission_rate: 5.0,
        tier_multipliers: {
          lead: 1.0,
          silver: 1.2,
          gold: 1.5,
          platinum: 2.0
        },
        commission_cap: 1000.0
      };
      
      const commissionSettings = settings || defaultSettings;
      
      // Use the actual values in the aggregation pipeline
      const baseRate = commissionSettings.base_commission_rate;
      const leadMultiplier = commissionSettings.tier_multipliers.lead;
      const silverMultiplier = commissionSettings.tier_multipliers.silver;
      const goldMultiplier = commissionSettings.tier_multipliers.gold;
      const platinumMultiplier = commissionSettings.tier_multipliers.platinum;
      const commissionCap = commissionSettings.commission_cap;
      
      // Calculate commission statistics from all sales
      const salesStats = await this.saleModel.model.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            calculatedCommission: {
              $cond: [
                { $and: [
                  { $ne: ['$commission.amount', null] },
                  { $ne: ['$commission.amount', undefined] },
                  { $gt: ['$commission.amount', 0] }
                ]},
                '$commission.amount',
                {
                  $let: {
                    vars: {
                      userTier: { $ifNull: ['$user.loyalty_tier', 'lead'] },
                      tierMultiplier: {
                        $switch: {
                          branches: [
                            { case: { $eq: ['$user.loyalty_tier', 'silver'] }, then: silverMultiplier },
                            { case: { $eq: ['$user.loyalty_tier', 'gold'] }, then: goldMultiplier },
                            { case: { $eq: ['$user.loyalty_tier', 'platinum'] }, then: platinumMultiplier }
                          ],
                          default: leadMultiplier
                        }
                      },
                      baseCommission: { $multiply: ['$total_amount', { $divide: [baseRate, 100] }] }
                    },
                    in: {
                      $min: [
                        { $multiply: ['$$baseCommission', '$$tierMultiplier'] },
                        commissionCap
                      ]
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total_commissions: { $sum: 1 },
            total_commission_amount: { $sum: '$calculatedCommission' },
            paid_commissions: { 
              $sum: { 
                $cond: [
                  { $eq: ['$payment_status', 'paid'] }, 
                  1, 
                  0
                ] 
              } 
            },
            paid_commission_amount: { 
              $sum: { 
                $cond: [
                  { $eq: ['$payment_status', 'paid'] }, 
                  '$calculatedCommission', 
                  0
                ] 
              } 
            },
            pending_commissions: { 
              $sum: { 
                $cond: [
                  { $eq: ['$payment_status', 'pending'] }, 
                  1, 
                  0
                ] 
              } 
            },
            pending_commission_amount: { 
              $sum: { 
                $cond: [
                  { $eq: ['$payment_status', 'pending'] }, 
                  '$calculatedCommission', 
                  0
                ] 
              } 
            }
          }
        }
      ]);

      const stats = salesStats[0] || {};
      
      // Calculate average commission amount
      const avgCommissionAmount = stats.total_commissions > 0 
        ? stats.total_commission_amount / stats.total_commissions 
        : 0;

      // Get top influencers from sales data - only users with 'influencer' role
      let topInfluencers = [];
      try {
        const userSales = await this.saleModel.model.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $addFields: {
              calculatedCommission: {
                $cond: [
                  { $and: [
                    { $ne: ['$commission.amount', null] },
                    { $ne: ['$commission.amount', undefined] },
                    { $gt: ['$commission.amount', 0] }
                  ]},
                  '$commission.amount',
                  {
                    $let: {
                      vars: {
                        userTier: { $ifNull: ['$user.loyalty_tier', 'lead'] },
                        tierMultiplier: {
                          $switch: {
                            branches: [
                              { case: { $eq: ['$user.loyalty_tier', 'silver'] }, then: silverMultiplier },
                              { case: { $eq: ['$user.loyalty_tier', 'gold'] }, then: goldMultiplier },
                              { case: { $eq: ['$user.loyalty_tier', 'platinum'] }, then: platinumMultiplier }
                            ],
                            default: leadMultiplier
                          }
                        },
                        baseCommission: { $multiply: ['$total_amount', { $divide: [baseRate, 100] }] }
                      },
                      in: {
                        $min: [
                          { $multiply: ['$$baseCommission', '$$tierMultiplier'] },
                          commissionCap
                        ]
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            $match: {
              'user.role': 'influencer'
            }
          },
          {
            $group: {
              _id: '$user_id',
              total_sales: { $sum: '$total_amount' },
              total_commission: { $sum: '$calculatedCommission' },
              sales_count: { $sum: 1 },
              user_name: { $first: { $concat: ['$user.first_name', ' ', '$user.last_name'] } },
              user_tier: { $first: '$user.loyalty_tier' }
            }
          },
          {
            $sort: { total_commission: -1 }
          },
          {
            $limit: 5
          }
        ]);
        
        topInfluencers = userSales.map(us => ({
          name: us.user_name || 'Unknown User',
          network: 0, // Placeholder
          commission: us.total_commission || 0,
          tier: us.user_tier || 'unknown'
        }));
        
      } catch (influencerError) {
        console.error('Error getting top influencers from sales:', influencerError);
        topInfluencers = [];
      }

      return {
        total_commissions: stats.total_commissions || 0,
        total_commission_amount: stats.total_commission_amount || 0,
        avg_commission_amount: avgCommissionAmount,
        pending_commissions: stats.pending_commissions || 0,
        approved_commissions: stats.paid_commissions || 0,
        rejected_commissions: 0, // No rejected commissions in current system
        paid_commissions: stats.paid_commissions || 0,
        total_paid_commissions: stats.paid_commission_amount || 0,
        total_pending_commissions: stats.pending_commission_amount || 0,
        total_approved_commissions: stats.paid_commission_amount || 0,
        commissions_today: 0, // Will be calculated separately if needed
        commissions_week: 0,  // Will be calculated separately if needed
        commissions_month: 0, // Will be calculated separately if needed
        topInfluencers: topInfluencers
      };
    } catch (error) {
      console.error('Error getting commission stats:', error);
      return {
        total_commissions: 0,
        total_commission_amount: 0,
        avg_commission_amount: 0,
        pending_commissions: 0,
        approved_commissions: 0,
        rejected_commissions: 0,
        paid_commissions: 0,
        total_paid_commissions: 0,
        total_pending_commissions: 0,
        total_approved_commissions: 0,
        commissions_today: 0,
        commissions_week: 0,
        commissions_month: 0,
        topInfluencers: []
      };
    }
  }

  // Get campaign statistics
  async getCampaignStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const pipeline = [
        {
          $group: {
            _id: null,
            total_campaigns: { $sum: 1 },
            active_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
            draft_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            completed_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            campaigns_today: { $sum: { $cond: [{ $gte: ['$created_at', today] }, 1, 0] } },
            campaigns_week: { $sum: { $cond: [{ $gte: ['$created_at', weekAgo] }, 1, 0] } },
            campaigns_month: { $sum: { $cond: [{ $gte: ['$created_at', monthAgo] }, 1, 0] } }
          }
        }
      ];

      const result = await this.campaignModel.model.aggregate(pipeline);
      const stats = result[0] || {};
      
      return {
        activeCampaigns: stats.active_campaigns || 0,
        totalCampaigns: stats.total_campaigns || 0,
        campaignPerformance: stats.active_campaigns > 0 ? 
          ((stats.completed_campaigns || 0) / stats.active_campaigns * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      return {
        activeCampaigns: 0,
        totalCampaigns: 0,
        campaignPerformance: 0
      };
    }
  }

  // Get recent activity
  async getRecentActivity(limit = 10) {
    try {
      const activities = [];

      // Get recent users (excluding staff)
      const customerRoles = ['user', 'customer', 'influencer'];
      const recentUsers = await this.userModel.model
        .find({ role: { $in: customerRoles } }, { first_name: 1, last_name: 1, email: 1, phone: 1, loyalty_tier: 1, created_at: 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      // Get recent sales
      const recentSales = await this.saleModel.model
        .find({}, { user_id: 1, store_id: 1, total_amount: 1, created_at: 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      // Get recent stores
      const recentStores = await this.storeModel.model
        .find({}, { name: 1, city: 1, country: 1, created_at: 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      // Get user sales data for recent users
      const userIds = recentUsers.map(user => user._id);
      const userSalesData = await this.saleModel.model.aggregate([
        {
          $match: {
            user_id: { $in: userIds },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$user_id',
            total_liters: { $sum: '$total_liters' },
            total_cashback: { $sum: '$cashback_earned' },
            total_sales: { $sum: 1 }
          }
        }
      ]);

      // Create a map of user sales data
      const userSalesMap = new Map();
      userSalesData.forEach(sales => {
        userSalesMap.set(sales._id.toString(), sales);
      });

      // Transform and combine activities
      const userActivities = recentUsers.map(user => {
        const salesData = userSalesMap.get(user._id.toString()) || { total_liters: 0, total_cashback: 0, total_sales: 0 };
        return {
          type: 'user',
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          loyalty_tier: user.loyalty_tier || 'Lead',
          total_liters: salesData.total_liters,
          total_cashback: salesData.total_cashback,
          total_sales: salesData.total_sales,
          timestamp: user.created_at,
          description: 'New user registered'
        };
      });

      const saleActivities = recentSales.map(sale => ({
        type: 'sale',
        id: sale._id,
        user_id: sale.user_id,
        store_id: sale.store_id,
        total_amount: sale.total_amount,
        timestamp: sale.created_at,
        description: 'New sale recorded'
      }));

      const storeActivities = recentStores.map(store => ({
        type: 'store',
        id: store._id,
        name: store.name,
        city: store.city,
        country: store.country,
        timestamp: store.created_at,
        description: 'New store added'
      }));

      // Combine and sort by date
      activities.push(...userActivities, ...saleActivities, ...storeActivities);
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Get chart data for sales over time
  async getSalesChartData(period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let groupBy;
      switch (period) {
        case '7':
        case '30':
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '90':
        case '365':
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        default:
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      }

      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            sales_count: { $sum: 1 },
            revenue: { $sum: "$total_amount" },
            liters: { $sum: "$quantity" }, // Use quantity as liters
            unique_customers: { $addToSet: "$user_id" }
          }
        },
        {
          $project: {
            month: "$_id",
            liters: 1,
            revenue: 1,
            sales_count: 1,
            unique_customers: { $size: "$unique_customers" }
          }
        },
        {
          $sort: { month: 1 }
        }
      ];

      return await this.saleModel.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting sales chart data:', error);
      return [];
    }
  }

  // Get chart data for user registrations over time
  async getUserRegistrationsChartData(period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let groupBy;
      switch (period) {
        case '7':
        case '30':
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '90':
        case '365':
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        default:
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      }

      const customerRoles = ['user', 'customer', 'influencer'];
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            role: { $in: customerRoles }
          }
        },
        {
          $group: {
            _id: groupBy,
            registrations: { $sum: 1 }
          }
        },
        {
          $project: {
            date: "$_id",
            registrations: 1
          }
        },
        {
          $sort: { date: 1 }
        }
      ];

      return await this.userModel.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting user registrations chart data:', error);
      return [];
    }
  }

  // Get top performing stores
  async getTopPerformingStores(limit = 10) {
    try {
      const pipeline = [
        {
          $match: { status: 'active' }
        },
        {
          $lookup: {
            from: 'sales',
            localField: '_id',
            foreignField: 'store_id',
            as: 'sales'
          }
        },
        {
          $project: {
            id: '$_id',
            name: 1,
            city: 1,
            country: 1,
            total_sales: { $size: '$sales' },
            total_revenue: { $sum: '$sales.total_amount' },
            avg_sale_amount: { $avg: '$sales.total_amount' },
            unique_customers: { $size: { $setUnion: ['$sales.user_id', []] } }
          }
        },
        {
          $sort: { total_revenue: -1 }
        },
        {
          $limit: limit
        }
      ];

      return await this.storeModel.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting top performing stores:', error);
      return [];
    }
  }

  // Get top customers
  async getTopCustomers(limit = 10) {
    try {
      const customerRoles = ['user', 'customer', 'influencer'];
      const pipeline = [
        {
          $match: { 
            status: 'active',
            role: { $in: customerRoles }
          }
        },
        {
          $lookup: {
            from: 'sales',
            localField: '_id',
            foreignField: 'user_id',
            as: 'sales'
          }
        },
        {
          $project: {
            id: '$_id',
            first_name: 1,
            last_name: 1,
            email: 1,
            loyalty_tier: 1,
            total_purchases: { $size: '$sales' },
            total_spent: { $sum: '$sales.total_amount' },
            avg_purchase_amount: { $avg: '$sales.total_amount' },
            points_balance: 1,
            total_liters: 1
          }
        },
        {
          $sort: { total_spent: -1 }
        },
        {
          $limit: limit
        }
      ];

      return await this.userModel.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting top customers:', error);
      return [];
    }
  }

  // Get loyalty tier distribution
  async getLoyaltyTierDistribution() {
    try {
      const customerRoles = ['user', 'customer', 'influencer'];
      const pipeline = [
        {
          $match: { 
            loyalty_tier: { $ne: null },
            role: { $in: customerRoles }
          }
        },
        {
          $group: {
            _id: '$loyalty_tier',
            user_count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            let: {},
            pipeline: [{ $count: 'total' }],
            as: 'total_users'
          }
        },
        {
          $project: {
            loyalty_tier: '$_id',
            user_count: 1,
            percentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$user_count', { $arrayElemAt: ['$total_users.total', 0] }] },
                    100
                  ]
                },
                2
              ]
            }
          }
        },
        {
          $sort: { user_count: -1 }
        }
      ];

      return await this.userModel.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting loyalty tier distribution:', error);
      return [];
    }
  }

  // Get geographical distribution
  async getGeographicalDistribution() {
    try {
      const pipeline = [
        {
          $group: {
            _id: {
              country: '$country',
              city: '$city'
            },
            store_count: { $sum: 1 },
            active_stores: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        },
        {
          $project: {
            country: '$_id.country',
            city: '$_id.city',
            store_count: 1,
            active_stores: 1
          }
        },
        {
          $sort: { store_count: -1 }
        }
      ];

      return await this.storeModel.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting geographical distribution:', error);
      return [];
    }
  }
}

module.exports = new DashboardController(); 
