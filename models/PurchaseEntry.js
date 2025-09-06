const BaseModel = require('./BaseModel');
const PurchaseEntrySchema = require('../schemas/PurchaseEntry');

class PurchaseEntry extends BaseModel {
  constructor() {
    super(PurchaseEntrySchema);
  }

  async findByEntryNumber(entryNumber) {
    return await PurchaseEntrySchema.findOne({ entry_number: entryNumber.toUpperCase() });
  }

  async findByUser(userId) {
    return await PurchaseEntrySchema.find({ user: userId });
  }

  async findByStore(storeId) {
    return await PurchaseEntrySchema.find({ store: storeId });
  }

  async findByStatus(status) {
    return await PurchaseEntrySchema.find({ status });
  }

  async getEntryStats(startDate = null, endDate = null) {
    try {
      const matchConditions = {};
      
      if (startDate && endDate) {
        matchConditions.entry_date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            total_entries: { $sum: 1 },
            approved_entries: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pending_entries: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejected_entries: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            total_value: { $sum: '$amount' },
            total_liters: { $sum: '$liters' },
            total_points: { $sum: '$points_earned' },
            avg_entry_value: { $avg: '$amount' },
            avg_liters_per_entry: { $avg: '$liters' }
          }
        }
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = result[0] || {};

      return {
        total_entries: stats.total_entries || 0,
        approved_entries: stats.approved_entries || 0,
        pending_entries: stats.pending_entries || 0,
        rejected_entries: stats.rejected_entries || 0,
        total_value: stats.total_value || 0,
        total_liters: stats.total_liters || 0,
        total_points: stats.total_points || 0,
        avg_entry_value: stats.avg_entry_value || 0,
        avg_liters_per_entry: stats.avg_liters_per_entry || 0
      };
    } catch (error) {
      console.error('Error getting purchase entry stats:', error);
      return {
        total_entries: 0,
        approved_entries: 0,
        pending_entries: 0,
        rejected_entries: 0,
        total_value: 0,
        total_liters: 0,
        total_points: 0,
        avg_entry_value: 0,
        avg_liters_per_entry: 0
      };
    }
  }
}

module.exports = PurchaseEntry; 