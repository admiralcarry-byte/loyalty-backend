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
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'email', 'first_name', 'last_name', 'role', 'loyalty_tier', 'status', 'createdAt'];
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

    // Get cashback data for each user
    const CashbackTransaction = require('../models/CashbackTransaction');
    const cashbackModel = new CashbackTransaction();

    // Process users and add additional data
    const processedUsers = await Promise.all(users.map(async (user) => {
      // Get referrer names for referred_by
      if (user.referred_by) {
        const referrer = await userModel.findById(user.referred_by);
        if (referrer) {
          user.referred_by_name = `${referrer.first_name} ${referrer.last_name}`;
        }
      }

      // Get total liters and cashback from actual sales data
      const Sale = require('../models/Sale');
      const saleModel = new Sale();
      
      const salesStats = await saleModel.model.aggregate([
        { $match: { user_id: user._id, status: 'completed' } },
        {
          $group: {
            _id: null,
            total_liters_from_sales: { $sum: '$total_liters' },
            total_cashback_from_sales: { $sum: '$cashback_earned' },
            total_commission_from_sales: { $sum: '$commission.amount' },
            total_sales: { $sum: 1 }
          }
        }
      ]);

      const salesData = salesStats[0] || { total_liters_from_sales: 0, total_cashback_from_sales: 0, total_commission_from_sales: 0, total_sales: 0 };

      // Debug logging for Kevin
      if (user.first_name === 'Kevin') {
        console.log('Kevin sales data:', salesData);
        console.log('Kevin user ID:', user._id);
      }

      // Also get cashback from CashbackTransaction collection (if any)
      const cashbackStats = await cashbackModel.model.aggregate([
        { $match: { user_id: user._id } },
        {
          $group: {
            _id: null,
            total_cashback_from_transactions: { $sum: '$amount' },
            cashback_count: { $sum: 1 }
          }
        }
      ]);

      const transactionCashback = cashbackStats[0]?.total_cashback_from_transactions || 0;
      
      // Use the higher of the two values (sales cashback or transaction cashback)
      const totalCashback = Math.max(salesData.total_cashback_from_sales, transactionCashback);

      // Use commission data from sales only (Commission table removed)
      const totalCommission = salesData.total_commission_from_sales;

      // Debug logging for Kevin
      if (user.first_name === 'Kevin') {
        console.log('Kevin total cashback:', totalCashback);
        console.log('Kevin transaction cashback:', transactionCashback);
        console.log('Kevin total commission:', totalCommission);
        console.log('Kevin sales commission:', salesData.total_commission_from_sales);
      }

      // Format the user data properly
      return {
        _id: user._id,
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        role: user.role,
        status: user.status,
        loyalty_tier: user.loyalty_tier,
        total_liters: salesData.total_liters_from_sales || 0,
        points_balance: user.points_balance || 0,
        total_cashback: totalCashback,
        total_commission: totalCommission,
        referral_code: user.referral_code,
        created_at: user.createdAt || user.created_at || user.updatedAt || user.updated_at || new Date(),
        updated_at: user.updated_at,
        last_login: user.last_login,
        address: user.address
      };
    }));

    return {
      users: processedUsers,
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
    try {
      // Define customer roles (exclude staff)
      const customerRoles = ['customer', 'influencer'];
      
      // Get user statistics
      const userStats = await userModel.model.aggregate([
        {
          $match: { role: { $in: customerRoles } }
        },
        {
          $group: {
            _id: null,
            total_users: { $sum: 1 },
            active_users: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive_users: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
            customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
            influencers: { $sum: { $cond: [{ $eq: ['$role', 'influencer'] }, 1, 0] } },
            platinum_users: { $sum: { $cond: [{ $eq: ['$loyalty_tier', 'platinum'] }, 1, 0] } },
            avg_points: { $avg: '$points_balance' },
            total_liters: { $sum: '$total_liters' }
          }
        }
      ]);

      // Get total cashback distributed
      const CashbackTransaction = require('../models/CashbackTransaction');
      const cashbackModel = new CashbackTransaction();
      const cashbackStats = await cashbackModel.model.aggregate([
        {
          $group: {
            _id: null,
            total_cashback: { $sum: '$amount' }
          }
        }
      ]);

      const stats = userStats[0] || {};
      const totalCashback = cashbackStats[0]?.total_cashback || 0;

      return {
        total_users: stats.total_users || 0,
        active_users: stats.active_users || 0,
        inactive_users: stats.inactive_users || 0,
        customers: stats.customers || 0,
        influencers: stats.influencers || 0,
        platinum_users: stats.platinum_users || 0,
        avg_points: stats.avg_points || 0,
        total_liters: stats.total_liters || 0,
        total_cashback: totalCashback
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        customers: 0,
        influencers: 0,
        platinum_users: 0,
        avg_points: 0,
        total_liters: 0,
        total_cashback: 0
      };
    }
  }

  // Check if user has related data
  async checkUserRelatedData(userId) {
    // Check various collections for related data (Commission table removed)
    const { Sale, PointsTransaction } = require('../models');
    
    try {
      // Check sales
      const salesCount = await Sale.countDocuments({ user_id: userId });
      if (salesCount > 0) return true;
      
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
      const Sale = require('../models/Sale');
      const saleModel = new Sale();

      // Get users with influencer role only
      const influencers = await userModel.model.find({
        role: 'influencer'
      }).select('_id first_name last_name phone loyalty_tier status created_at');

      // Get performance data for each influencer
      const performanceData = await Promise.all(
        influencers.map(async (influencer) => {
          // Get commission data from sales (Commission table removed)
          const commissionStats = await saleModel.model.aggregate([
            { $match: { user_id: influencer._id } },
            {
              $group: {
                _id: null,
                total_commission: { $sum: '$commission.amount' },
                monthly_commission: { 
                  $sum: { 
                    $cond: [
                      { $gte: ['$created_at', new Date(new Date().setMonth(new Date().getMonth() - 1))] },
                      '$commission.amount',
                      0
                    ]
                  }
                },
                pending_payout: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$commission.amount', 0]
                  }
                }
              }
            }
          ]);

          // Get sales data generated by this influencer through referrals
          const salesStats = await saleModel.model.aggregate([
            { $match: { 'referral.referrer': influencer._id } },
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

  // Admin reset user password
  async resetUserPassword(id, newPassword) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password and set password changed timestamp
    await userModel.updateById(id, { 
      password_hash: newPasswordHash,
      'security.password_changed_at': new Date()
    });

    return { message: 'Password reset successfully' };
  }

  // Get all user statistics
  async getAllUserStats() {
    try {
      const userModel = new User();
      
      // Get comprehensive user statistics
      const stats = await userModel.executeQuery(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
          COUNT(CASE WHEN role = 'influencer' THEN 1 END) as influencers,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
          COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff,
          COUNT(CASE WHEN loyalty_tier = 'lead' THEN 1 END) as lead_users,
          COUNT(CASE WHEN loyalty_tier = 'silver' THEN 1 END) as silver_users,
          COUNT(CASE WHEN loyalty_tier = 'gold' THEN 1 END) as gold_users,
          COUNT(CASE WHEN loyalty_tier = 'platinum' THEN 1 END) as platinum_users,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_users_today,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as new_users_week,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_users_month
        FROM users
      `);

      return stats[0] || {};
    } catch (error) {
      console.error('Get all user stats error:', error);
      throw error;
    }
  }
}

module.exports = new UserController(); 