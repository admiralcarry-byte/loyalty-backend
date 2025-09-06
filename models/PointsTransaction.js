const BaseModel = require('./BaseModel');
const PointsTransactionSchema = require('../schemas/PointsTransaction');

class PointsTransaction extends BaseModel {
  constructor() {
    super(PointsTransactionSchema);
  }

  async findByTransactionNumber(transactionNumber) {
    return await PointsTransactionSchema.findByTransactionNumber(transactionNumber);
  }

  async findByUser(userId, options = {}) {
    return await PointsTransactionSchema.findByUser(userId, options);
  }

  async findByType(type) {
    return await PointsTransactionSchema.findByType(type);
  }

  async findBySource(source) {
    return await PointsTransactionSchema.findBySource(source);
  }

  async findExpired() {
    return await PointsTransactionSchema.findExpired();
  }

  async findByReference(referenceId, referenceModel) {
    return await PointsTransactionSchema.findByReference(referenceId, referenceModel);
  }

  async getUserPointsSummary(userId) {
    return await PointsTransactionSchema.getUserPointsSummary(userId);
  }

  async getPointsTransactionStats() {
    return await PointsTransactionSchema.getPointsTransactionStats();
  }

  async getPointsStats(startDate = null, endDate = null) {
    try {
      const matchConditions = {};
      
      if (startDate && endDate) {
        matchConditions.created_at = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            total_points_transactions: { $sum: 1 },
            total_points_earned: { $sum: { $cond: [{ $gt: ['$points', 0] }, '$points', 0] } },
            total_points_spent: { $sum: { $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0] } },
            avg_points_per_transaction: { $avg: { $abs: '$points' } },
            earned_transactions: { $sum: { $cond: [{ $gt: ['$points', 0] }, 1, 0] } },
            spent_transactions: { $sum: { $cond: [{ $lt: ['$points', 0] }, 1, 0] } }
          }
        }
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = result[0] || {};

      // Calculate time-based stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const todayStats = await this.model.aggregate([
        { $match: { created_at: { $gte: today } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);

      const weekStats = await this.model.aggregate([
        { $match: { created_at: { $gte: weekAgo } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);

      const monthStats = await this.model.aggregate([
        { $match: { created_at: { $gte: monthAgo } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);

      return {
        total_points_transactions: stats.total_points_transactions || 0,
        total_points_earned: stats.total_points_earned || 0,
        total_points_spent: stats.total_points_spent || 0,
        avg_points_per_transaction: stats.avg_points_per_transaction || 0,
        earned_transactions: stats.earned_transactions || 0,
        spent_transactions: stats.spent_transactions || 0,
        points_today: todayStats[0]?.count || 0,
        points_week: weekStats[0]?.count || 0,
        points_month: monthStats[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting points stats:', error);
      return {
        total_points_transactions: 0,
        total_points_earned: 0,
        total_points_spent: 0,
        avg_points_per_transaction: 0,
        earned_transactions: 0,
        spent_transactions: 0,
        points_today: 0,
        points_week: 0,
        points_month: 0
      };
    }
  }

  async getTopPointsEarners(limit = 10, startDate = null, endDate = null) {
    try {
      const matchConditions = {};
      
      if (startDate && endDate) {
        matchConditions.created_at = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: '$user',
            total_points: { $sum: '$points' },
            transaction_count: { $sum: 1 }
          }
        },
        { $sort: { total_points: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            user_id: '$_id',
            first_name: { $arrayElemAt: ['$user.first_name', 0] },
            last_name: { $arrayElemAt: ['$user.last_name', 0] },
            email: { $arrayElemAt: ['$user.email', 0] },
            username: { $arrayElemAt: ['$user.username', 0] },
            total_points: 1,
            transaction_count: 1
          }
        }
      ];

      return await this.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting top points earners:', error);
      return [];
    }
  }
}

module.exports = PointsTransaction; 