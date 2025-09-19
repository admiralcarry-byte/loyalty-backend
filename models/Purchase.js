const BaseModel = require('./BaseModel');
const PurchaseSchema = require('../schemas/Purchase');

class Purchase extends BaseModel {
  constructor() {
    super(PurchaseSchema);
  }

  async findByPurchaseNumber(purchaseNumber) {
    return await PurchaseSchema.findOne({ purchase_number: purchaseNumber.toUpperCase() });
  }

  async findByUser(userId) {
    return await PurchaseSchema.find({ user_id: userId });
  }

  async findByStore(storeId) {
    return await PurchaseSchema.find({ store_id: storeId });
  }

  async findByStatus(status) {
    return await PurchaseSchema.find({ status });
  }

  async getPurchaseStats(startDate = null, endDate = null) {
    try {
      const matchConditions = {};
      
      if (startDate && endDate) {
        matchConditions.purchase_date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            total_purchases: { $sum: 1 },
            completed_purchases: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pending_purchases: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            cancelled_purchases: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            total_value: { $sum: '$total_amount' },
            total_liters: { $sum: '$total_liters' },
            total_points: { $sum: '$total_points' },
            avg_purchase_value: { $avg: '$total_amount' },
            avg_liters_per_purchase: { $avg: '$total_liters' }
          }
        }
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = result[0] || {};

      return {
        total_purchases: stats.total_purchases || 0,
        completed_purchases: stats.completed_purchases || 0,
        pending_purchases: stats.pending_purchases || 0,
        cancelled_purchases: stats.cancelled_purchases || 0,
        total_value: stats.total_value || 0,
        total_liters: stats.total_liters || 0,
        total_points: stats.total_points || 0,
        avg_purchase_value: stats.avg_purchase_value || 0,
        avg_liters_per_purchase: stats.avg_liters_per_purchase || 0
      };
    } catch (error) {
      console.error('Error getting purchase stats:', error);
      return {
        total_purchases: 0,
        completed_purchases: 0,
        pending_purchases: 0,
        cancelled_purchases: 0,
        total_value: 0,
        total_liters: 0,
        total_points: 0,
        avg_purchase_value: 0,
        avg_liters_per_purchase: 0
      };
    }
  }

  // Get pending purchases
  async getPendingPurchases() {
    return await PurchaseSchema.find({ status: 'pending' }).sort({ created_at: -1 });
  }
}

module.exports = Purchase; 