const User = require('../models/User');
const { validationResult } = require('express-validator');

const userModel = new User();

class UserController {
  // Get all users with pagination and filters
  async getAllUsers(req) {
    const {
      page = 1,
      limit = 50,
      search = '',
      role = '',
      tier = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'email', 'first_name', 'last_name', 'role', 'loyalty_tier', 'status', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) {
      throw new Error('Invalid sort field');
    }

    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      throw new Error('Invalid sort order');
    }

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (tier) {
      whereConditions.push('loyalty_tier = ?');
      params.push(tier);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build MongoDB query
    const query = {};
    
    // Filter to show only customer data (exclude admin, manager, staff)
    const customerRoles = ['user', 'customer', 'influencer'];
    query.role = { $in: customerRoles };
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      // Only allow filtering by customer roles
      if (customerRoles.includes(role)) {
        query.role = role;
      } else {
        // If non-customer role is requested, return empty result
        query.role = { $in: [] };
      }
    }
    if (status) query.status = status;
    if (tier) query.loyalty_tier = tier;

    // Get total count
    const total = await userModel.model.countDocuments(query);

    // Get users with pagination
    const users = await userModel.model.find(query)
      .select('email first_name last_name phone role loyalty_tier status total_liters points_balance referral_code referred_by avatar_url date_of_birth gender address city country created_at updated_at last_login email_verified phone_verified')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(offset);

    // Get referrer names for referred_by
    for (let user of users) {
      if (user.referred_by) {
        const referrer = await userModel.findById(user.referred_by);
        if (referrer) {
          user.referred_by_name = `${referrer.first_name} ${referrer.last_name}`;
        }
      }
    }

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get user by ID
  async getUserById(id) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Get referrer name if exists
    if (user.referred_by) {
              const referrer = await userModel.findById(user.referred_by);
      if (referrer) {
        user.referred_by_name = `${referrer.first_name} ${referrer.last_name}`;
      }
    }

    return user;
  }

  // Create new user
  async createUser(userData) {
    // Validation should be handled in the route middleware
    // This method assumes data is already validated

    // Check if email already exists
    const existingUser = await userModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    return await userModel.createUser(userData);
  }

  // Update user
  async updateUser(id, userData) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = await userModel.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    return await userModel.updateUser(id, userData);
  }

  // Delete user
  async deleteUser(id) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has any related data
    const hasRelatedData = await this.checkUserRelatedData(id);
    if (hasRelatedData) {
      throw new Error('Cannot delete user with related data');
    }

    return await userModel.deleteById(id);
  }

  // Update user status
  async updateUserStatus(id, status) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return await userModel.updateById(id, { status });
  }

  // Update user role
  async updateUserRole(id, role) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const validRoles = ['user', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    return await userModel.updateById(id, { role });
  }

  // Update points balance
  async updatePointsBalance(id, points) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return await userModel.updatePointsBalance(id, points);
  }

  // Update liter balance
  async updateLiterBalance(id, liters) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return await userModel.updateLiterBalance(id, liters);
  }

  // Get user statistics
  async getUserStats() {
    const userInstance = new User();
    const stats = await userInstance.executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        AVG(points_balance) as avg_points,
        SUM(total_liters) as total_liters
      FROM users
    `);

    return stats[0];
  }

  // Check if user has related data
  async checkUserRelatedData(userId) {
    // Check various collections for related data
    const { Sale, Commission, PointsTransaction } = require('../models');
    
    try {
      // Check sales
      const salesCount = await Sale.countDocuments({ user_id: userId });
      if (salesCount > 0) return true;
      
      // Check commissions
      const commissionsCount = await Commission.countDocuments({ user_id: userId });
      if (commissionsCount > 0) return true;
      
      // Check points transactions
      const pointsCount = await PointsTransaction.countDocuments({ user_id: userId });
      if (pointsCount > 0) return true;
      
      return false;
    } catch (error) {
      console.error('Error checking user related data:', error);
      return false; // Allow deletion if we can't check
    }
  }

  // Search users
  async searchUsers(searchTerm, limit = 10) {
    try {
      const searchPattern = new RegExp(searchTerm, 'i');
      const customerRoles = ['user', 'customer', 'influencer'];
      
      return await userModel.model.find({
        role: { $in: customerRoles },
        $or: [
          { first_name: searchPattern },
          { last_name: searchPattern },
          { email: searchPattern },
          { phone: searchPattern }
        ]
      }).limit(limit).select('id first_name last_name email phone role loyalty_tier status');
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get influencer performance data
  async getInfluencerPerformance() {
    try {
      const Commission = require('../models/Commission');
      const Sale = require('../models/Sale');
      const commissionModel = new Commission();
      const saleModel = new Sale();

      // Get users with influencer role or loyalty tiers
      const influencers = await userModel.model.find({
        $or: [
          { role: 'influencer' },
          { loyalty_tier: { $in: ['silver', 'gold', 'platinum'] } }
        ]
      }).select('_id first_name last_name phone loyalty_tier status created_at');

      // Get performance data for each influencer
      const performanceData = await Promise.all(
        influencers.map(async (influencer) => {
          // Get commission data
          const commissionStats = await commissionModel.model.aggregate([
            { $match: { user: influencer._id } },
            {
              $group: {
                _id: null,
                total_commission: { $sum: '$amount' },
                monthly_commission: { 
                  $sum: { 
                    $cond: [
                      { $gte: ['$created_at', new Date(new Date().setMonth(new Date().getMonth() - 1))] },
                      '$amount',
                      0
                    ]
                  }
                },
                pending_payout: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
                  }
                }
              }
            }
          ]);

          // Get sales data
          const salesStats = await saleModel.model.aggregate([
            { $match: { customer: influencer._id } },
            {
              $group: {
                _id: null,
                total_sales_liters: { $sum: '$total_liters' },
                total_sales_amount: { $sum: '$total_amount' }
              }
            }
          ]);

          // Get referral count (network size)
          const referralCount = await userModel.model.countDocuments({
            referred_by: influencer._id
          });

          const commission = commissionStats[0] || { total_commission: 0, monthly_commission: 0, pending_payout: 0 };
          const sales = salesStats[0] || { total_sales_liters: 0, total_sales_amount: 0 };

          return {
            id: influencer._id,
            name: `${influencer.first_name} ${influencer.last_name}`,
            phone: influencer.phone,
            tier: influencer.loyalty_tier || 'Lead',
            activeUsers: referralCount,
            totalSales: sales.total_sales_liters,
            monthlyCommission: commission.monthly_commission,
            pendingPayout: commission.pending_payout,
            status: influencer.status,
            joinDate: influencer.created_at,
            networkGrowth: 0 // This would need historical data to calculate
          };
        })
      );

      return performanceData;
    } catch (error) {
      console.error('Error getting influencer performance:', error);
      throw error;
    }
  }
}

module.exports = new UserController(); 