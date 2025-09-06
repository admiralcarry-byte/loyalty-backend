const BaseModel = require('./BaseModel');
const OnlinePurchaseSchema = require('../schemas/OnlinePurchase');

class OnlinePurchase extends BaseModel {
  constructor() {
    super(OnlinePurchaseSchema);
  }

  async findByOrderNumber(orderNumber) {
    return await OnlinePurchaseSchema.findOne({ order_number: orderNumber.toUpperCase() });
  }

  async findByUser(userId) {
    return await OnlinePurchaseSchema.find({ user: userId });
  }

  async findByStatus(status) {
    return await OnlinePurchaseSchema.find({ status });
  }

  async findByPaymentStatus(paymentStatus) {
    return await OnlinePurchaseSchema.find({ payment_status: paymentStatus });
  }

  async getOnlinePurchaseStats(startDate = null, endDate = null) {
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
            total_orders: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            avg_order_value: { $avg: '$total_amount' },
            pending_orders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            completed_orders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            processing_orders: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
            shipped_orders: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
            cancelled_orders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            total_liters: { $sum: '$liters_purchased' },
            total_points: { $sum: '$points_earned' }
          }
        }
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = result[0] || {};

      // Calculate conversion rate (completed orders / total orders)
      const conversionRate = stats.total_orders > 0 
        ? ((stats.completed_orders || 0) / stats.total_orders) * 100 
        : 0;

      return {
        total_orders: stats.total_orders || 0,
        total_revenue: stats.total_revenue || 0,
        avg_order_value: stats.avg_order_value || 0,
        conversion_rate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
        pending_orders: stats.pending_orders || 0,
        completed_orders: stats.completed_orders || 0,
        processing_orders: stats.processing_orders || 0,
        shipped_orders: stats.shipped_orders || 0,
        cancelled_orders: stats.cancelled_orders || 0,
        total_liters: stats.total_liters || 0,
        total_points: stats.total_points || 0
      };
    } catch (error) {
      console.error('Error getting online purchase stats:', error);
      return {
        total_orders: 0,
        total_revenue: 0,
        avg_order_value: 0,
        conversion_rate: 0,
        pending_orders: 0,
        completed_orders: 0,
        processing_orders: 0,
        shipped_orders: 0,
        cancelled_orders: 0,
        total_liters: 0,
        total_points: 0
      };
    }
  }
}

module.exports = OnlinePurchase; 