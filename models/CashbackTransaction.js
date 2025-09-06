const BaseModel = require('./BaseModel');
const CashbackTransactionSchema = require('../schemas/CashbackTransaction');

class CashbackTransaction extends BaseModel {
  constructor() {
    super(CashbackTransactionSchema);
  }

  async findByTransactionNumber(transactionNumber) {
    return await CashbackTransactionSchema.findOne({ transaction_number: transactionNumber.toUpperCase() });
  }

  async findByUser(userId) {
    return await CashbackTransactionSchema.find({ user: userId });
  }

  async findByStatus(status) {
    return await CashbackTransactionSchema.find({ status });
  }

  async getCashbackStats(startDate = null, endDate = null) {
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
            total_cashback_transactions: { $sum: 1 },
            total_cashback_amount: { $sum: '$amount' },
            avg_cashback_amount: { $avg: '$amount' },
            pending_cashback: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approved_cashback: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            paid_cashback: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            rejected_cashback: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            total_paid_cashback: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            total_pending_cashback: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            total_approved_cashback: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } }
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
        total_cashback_transactions: stats.total_cashback_transactions || 0,
        total_cashback_amount: stats.total_cashback_amount || 0,
        avg_cashback_amount: stats.avg_cashback_amount || 0,
        pending_cashback: stats.pending_cashback || 0,
        approved_cashback: stats.approved_cashback || 0,
        paid_cashback: stats.paid_cashback || 0,
        rejected_cashback: stats.rejected_cashback || 0,
        total_paid_cashback: stats.total_paid_cashback || 0,
        total_pending_cashback: stats.total_pending_cashback || 0,
        total_approved_cashback: stats.total_approved_cashback || 0,
        cashback_today: todayStats[0]?.count || 0,
        cashback_week: weekStats[0]?.count || 0,
        cashback_month: monthStats[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting cashback stats:', error);
      return {
        total_cashback_transactions: 0,
        total_cashback_amount: 0,
        avg_cashback_amount: 0,
        pending_cashback: 0,
        approved_cashback: 0,
        paid_cashback: 0,
        rejected_cashback: 0,
        total_paid_cashback: 0,
        total_pending_cashback: 0,
        total_approved_cashback: 0,
        cashback_today: 0,
        cashback_week: 0,
        cashback_month: 0
      };
    }
  }

  async getTopCashbackEarners(limit = 10, startDate = null, endDate = null) {
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
            total_cashback: { $sum: '$amount' },
            transaction_count: { $sum: 1 }
          }
        },
        { $sort: { total_cashback: -1 } },
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
            total_cashback: 1,
            transaction_count: 1
          }
        }
      ];

      return await this.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting top cashback earners:', error);
      return [];
    }
  }
}

module.exports = CashbackTransaction; 