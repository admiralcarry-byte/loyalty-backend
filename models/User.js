const BaseModel = require('./BaseModel');
const UserSchema = require('../schemas/User');

class User extends BaseModel {
  constructor() {
    super(UserSchema);
  }

  // Create a new user with password hashing
  async createUser(userData) {
    // Don't hash the password here - let the pre-save hook handle it
    // Just rename password to password_hash for the schema
    if (userData.password) {
      userData.password_hash = userData.password;
      delete userData.password;
    }
    
    return await this.create(userData);
  }

  // Update user with password hashing if password is provided
  async updateUser(id, userData) {
    // Don't hash the password here - let the pre-save hook handle it
    // Just rename password to password_hash for the schema
    if (userData.password) {
      userData.password_hash = userData.password;
      delete userData.password;
    }
    
    return await this.updateById(id, userData);
  }

  // Find user by email
  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  // Find user by username
  async findByUsername(username) {
    return await this.model.findOne({ username });
  }

  // Find user by referral code
  async findByReferralCode(referralCode) {
    return await this.model.findOne({ referral_code: referralCode });
  }

  // Get only customers (excluding staff)
  async findCustomers(conditions = {}, options = {}) {
    const customerRoles = ['user', 'customer', 'influencer'];
    const customerConditions = {
      ...conditions,
      role: { $in: customerRoles }
    };
    return await this.findAll(customerConditions, options);
  }

  // Count only customers (excluding staff)
  async countCustomers(conditions = {}) {
    const customerRoles = ['user', 'customer', 'influencer'];
    const customerConditions = {
      ...conditions,
      role: { $in: customerRoles }
    };
    return await this.count(customerConditions);
  }

  // Verify password
  async verifyPassword(userId, password) {
    const user = await this.findById(userId);
    if (!user) return false;
    
    return await user.verifyPassword(password);
  }

  // Update last login
  async updateLastLogin(userId) {
    return await this.updateById(userId, { last_login: new Date() });
  }

  // Get users by role
  async findByRole(role) {
    return await this.findAll({ role });
  }

  // Get users by status
  async findByStatus(status) {
    return await this.findAll({ status });
  }

  // Get users by loyalty tier
  async findByLoyaltyTier(tier) {
    return await this.findAll({ loyalty_tier: tier });
  }

  // Update points balance
  async updatePointsBalance(userId, points) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    const newBalance = user.points_balance + points;
    return await this.updateById(userId, { points_balance: newBalance });
  }

  // Update liter balance
  async updateLiterBalance(userId, liters) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    const newBalance = parseFloat(user.liter_balance) + parseFloat(liters);
    return await this.updateById(userId, { liter_balance: newBalance });
  }

  // Update loyalty tier based on total liters
  async updateLoyaltyTier(userId) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    const totalLiters = parseFloat(user.total_liters);
    let newTier = 'lead';
    
    if (totalLiters >= 1000) newTier = 'platinum';
    else if (totalLiters >= 500) newTier = 'gold';
    else if (totalLiters >= 100) newTier = 'silver';
    
    if (newTier !== user.loyalty_tier) {
      return await this.updateById(userId, { loyalty_tier: newTier });
    }
    
    return user;
  }

  // Get users with referrals
  async getUsersWithReferrals() {
    return await this.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referred_by',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          referral_count: { $size: '$referrals' }
        }
      },
      {
        $match: {
          referral_code: { $exists: true, $ne: null }
        }
      },
      {
        $sort: { referral_count: -1 }
      }
    ]);
  }

  // Get top customers by total purchases
  async getTopCustomers(limit = 10) {
    return await this.findAll({}, {
      sort: { total_purchases: -1 },
      limit
    });
  }

  // Get top customers by total liters
  async getTopLitersCustomers(limit = 10) {
    return await this.findAll({}, {
      sort: { total_liters: -1 },
      limit
    });
  }

  // Get users with low points balance
  async getUsersWithLowPoints(minPoints = 100) {
    return await this.findAll({
      points_balance: { $lt: minPoints }
    });
  }

  // Search users
  async searchUsers(searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');
    return await this.findAll({
      $or: [
        { username: searchRegex },
        { email: searchRegex },
        { first_name: searchRegex },
        { last_name: searchRegex }
      ]
    }, {
      sort: { createdAt: -1 }
    });
  }

  // Get user statistics
  async getUserStats() {
    return await this.model.getUserStats();
  }

  // Get users created in date range
  async getUsersByDateRange(startDate, endDate) {
    return await this.findAll({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }, {
      sort: { createdAt: -1 }
    });
  }

  // Get users by last login (recently active)
  async getRecentlyActiveUsers(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await this.findAll({
      last_login: { $gte: cutoffDate }
    }, {
      sort: { last_login: -1 }
    });
  }

  // Get total users count
  async getTotalUsersCount() {
    try {
      const count = await this.model.countDocuments();
      return count;
    } catch (error) {
      console.error('Error getting total users count:', error);
      return 0;
    }
  }

  // Get average growth rate (placeholder implementation)
  async getAverageGrowthRate() {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd calculate based on user registration trends
      const currentMonth = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const currentMonthUsers = await this.model.countDocuments({
        createdAt: {
          $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
          $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        }
      });
      
      const lastMonthUsers = await this.model.countDocuments({
        createdAt: {
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
        }
      });
      
      if (lastMonthUsers === 0) return 0;
      
      const growthRate = ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
      return Math.round(growthRate * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error getting average growth rate:', error);
      return 0;
    }
  }
}

module.exports = User; 