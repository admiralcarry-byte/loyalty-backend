const { User, Store, Sale, Commission, Campaign } = require('../schemas');
const PercentageCalculator = require('../utils/percentageCalculator');

class DashboardController {
  constructor() {
    this.userModel = User;
    this.storeModel = Store;
    this.saleModel = Sale;
    this.commissionModel = Commission;
    this.campaignModel = Campaign;
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
      const totalUsers = await this.userModel.countDocuments({ 
        role: { $in: customerRoles } 
      });
      
      // Get active customers (excluding staff)
      const activeUsers = await this.userModel.countDocuments({ 
        status: 'active',
        role: { $in: customerRoles }
      });
      
      // Get customers by loyalty tier (excluding staff)
      const leadUsers = await this.userModel.countDocuments({ 
        loyalty_tier: 'lead',
        role: { $in: customerRoles }
      });
      const silverUsers = await this.userModel.countDocuments({ 
        loyalty_tier: 'silver',
        role: { $in: customerRoles }
      });
      const goldUsers = await this.userModel.countDocuments({ 
        loyalty_tier: 'gold',
        role: { $in: customerRoles }
      });
      const platinumUsers = await this.userModel.countDocuments({ 
        loyalty_tier: 'platinum',
        role: { $in: customerRoles }
      });
      
      // Get recent customers (current month, excluding staff)
      const newUsersThisMonth = await this.userModel.countDocuments({ 
        created_at: { 
          $gte: dateRanges.currentMonth.start,
          $lte: dateRanges.currentMonth.end
        },
        role: { $in: customerRoles }
      });
      
      // Get previous month users for comparison
      const newUsersPreviousMonth = await this.userModel.countDocuments({ 
        created_at: { 
          $gte: dateRanges.previousMonth.start,
          $lte: dateRanges.previousMonth.end
        },
        role: { $in: customerRoles }
      });
      
      // Get today's users
      const newUsersToday = await this.userModel.countDocuments({ 
        created_at: { 
          $gte: dateRanges.today.start,
          $lte: dateRanges.today.end
        },
        role: { $in: customerRoles }
      });
      
      // Get this week's users
      const newUsersThisWeek = await this.userModel.countDocuments({ 
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

      const stats = await this.storeModel.aggregate([
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
      const totalSales = await this.saleModel.aggregate([
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
      const currentMonthStats = await this.saleModel.aggregate([
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
      const previousMonthStats = await this.saleModel.aggregate([
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
      const overallStats = await this.saleModel.aggregate([
        {
          $group: {
            _id: null,
            total_sales: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            total_liters: { $sum: { $sum: '$items.liters' } },
            avg_sale_amount: { $avg: '$total_amount' },
            unique_customers: { $addToSet: '$user' },
            stores_with_sales: { $addToSet: '$store' }
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

  // Get commission statistics
  async getCommissionStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const stats = await this.commissionModel.aggregate([
        {
          $group: {
            _id: null,
            total_commissions: { $sum: 1 },
            total_commission_amount: { $sum: '$amount' },
            avg_commission_amount: { $avg: '$amount' },
            pending_commissions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approved_commissions: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejected_commissions: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            paid_commissions: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            total_paid_commissions: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            commissions_today: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } },
            commissions_week: { $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, 1, 0] } },
            commissions_month: { $sum: { $cond: [{ $gte: ['$createdAt', monthAgo] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {};
      
      // Get top influencers (simplified approach)
      let topInfluencers = [];
      try {
        // Get unique users who have commissions
        const userCommissions = await this.commissionModel.aggregate([
          {
            $group: {
              _id: '$user',
              total_commission: { $sum: '$amount' },
              commission_count: { $sum: 1 }
            }
          },
          {
            $sort: { total_commission: -1 }
          },
          {
            $limit: 5
          }
        ]);

        // Get user details for these users
        if (userCommissions.length > 0) {
          const userIds = userCommissions.map(uc => uc._id);
          const users = await this.userModel.find({ _id: { $in: userIds } });
          
          topInfluencers = userCommissions.map(uc => {
            const user = users.find(u => u._id.toString() === uc._id.toString());
            return {
              name: user ? `${user.first_name} ${user.last_name}` : 'Unknown User',
              network: 0, // Placeholder
              commission: uc.total_commission,
              tier: user ? user.loyalty_tier : 'unknown'
            };
          });
        }
      } catch (influencerError) {
        console.error('Error getting top influencers:', influencerError);
        topInfluencers = [];
      }

      return {
        totalCommissions: result.total_commissions || 0,
        paidCommissions: result.total_paid_commissions || 0,
        pendingCommissions: result.pending_commissions || 0,
        topInfluencers: topInfluencers
      };
    } catch (error) {
      console.error('Error getting commission stats:', error);
      return {
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
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

      const result = await this.campaignModel.aggregate(pipeline);
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
      const recentUsers = await this.userModel
        .find({ role: { $in: customerRoles } }, { first_name: 1, last_name: 1, email: 1, created_at: 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      // Get recent sales
      const recentSales = await this.saleModel
        .find({}, { customer: 1, store: 1, total_amount: 1, created_at: 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      // Get recent stores
      const recentStores = await this.storeModel
        .find({}, { name: 1, city: 1, country: 1, created_at: 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      // Transform and combine activities
      const userActivities = recentUsers.map(user => ({
        type: 'user',
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        created_at: user.created_at,
        description: 'New user registered'
      }));

      const saleActivities = recentSales.map(sale => ({
        type: 'sale',
        id: sale._id,
        user_id: sale.user_id,
        store_id: sale.store_id,
        total_amount: sale.total_amount,
        created_at: sale.created_at,
        description: 'New sale recorded'
      }));

      const storeActivities = recentStores.map(store => ({
        type: 'store',
        id: store._id,
        name: store.name,
        city: store.city,
        country: store.country,
        created_at: store.created_at,
        description: 'New store added'
      }));

      // Combine and sort by date
      activities.push(...userActivities, ...saleActivities, ...storeActivities);
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
            liters: { $sum: { $sum: "$items.liters" } },
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

      return await this.saleModel.aggregate(pipeline);
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

      return await this.userModel.aggregate(pipeline);
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