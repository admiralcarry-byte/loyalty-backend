const BaseModel = require('./BaseModel');
const CampaignSchema = require('../schemas/Campaign');

class Campaign extends BaseModel {
  constructor() {
    super(CampaignSchema);
  }

  async findByCode(code) {
    return await CampaignSchema.findByCode(code);
  }

  async findActive() {
    return await CampaignSchema.findActive();
  }

  async findByType(type) {
    return await CampaignSchema.findByType(type);
  }

  async findForUserTier(userTier) {
    return await CampaignSchema.findForUserTier(userTier);
  }

  async getCampaignStats() {
    return await CampaignSchema.getCampaignStats();
  }

  async getCampaignOverviewStats(startDate = null, endDate = null) {
    try {
      const matchConditions = {};

      if (startDate && endDate) {
        matchConditions.start_date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            total_campaigns: { $sum: 1 },
            active_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            draft_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            paused_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
            completed_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            total_views: { $sum: '$views' },
            total_engagement: { $avg: '$engagement_rate' },
            total_participants: { $sum: '$participants' },
            total_conversions: { $sum: '$conversions' }
          }
        }
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = result[0] || {};

      // Get best performing campaign by engagement rate
      const bestPerforming = await this.model.findOne(
        { status: 'active' },
        { name: 1, engagement_rate: 1, location: 1 },
        { sort: { engagement_rate: -1 } }
      );

      return {
        total_campaigns: stats.total_campaigns || 0,
        active_campaigns: stats.active_campaigns || 0,
        draft_campaigns: stats.draft_campaigns || 0,
        paused_campaigns: stats.paused_campaigns || 0,
        completed_campaigns: stats.completed_campaigns || 0,
        cancelled_campaigns: stats.cancelled_campaigns || 0,
        total_views: stats.total_views || 0,
        avg_engagement: Math.round((stats.total_engagement || 0) * 100) / 100,
        total_participants: stats.total_participants || 0,
        total_conversions: stats.total_conversions || 0,
        best_performing: bestPerforming?.location || 'N/A',
        best_performing_engagement: bestPerforming?.engagement_rate || 0
      };
    } catch (error) {
      console.error('Error getting campaign overview stats:', error);
      return {
        total_campaigns: 0,
        active_campaigns: 0,
        draft_campaigns: 0,
        paused_campaigns: 0,
        completed_campaigns: 0,
        cancelled_campaigns: 0,
        total_views: 0,
        avg_engagement: 0,
        total_participants: 0,
        total_conversions: 0,
        best_performing: 'N/A',
        best_performing_engagement: 0
      };
    }
  }
}

module.exports = Campaign; 