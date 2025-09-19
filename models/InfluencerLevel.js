const BaseModel = require('./BaseModel');
const InfluencerLevelSchema = require('../schemas/InfluencerLevel');

class InfluencerLevel extends BaseModel {
  constructor() {
    super(InfluencerLevelSchema);
  }

  // Create new influencer level
  async createInfluencerLevel(levelData) {
    try {
      // Check if level name already exists
      const existingLevel = await this.findOne({ name: levelData.name, is_active: true });
      if (existingLevel) {
        throw new Error(`Influencer level '${levelData.name}' already exists`);
      }

      return await this.create(levelData);
    } catch (error) {
      throw new Error(`Failed to create influencer level: ${error.message}`);
    }
  }

  // Update influencer level
  async updateInfluencerLevel(levelId, updateData) {
    try {
      // If updating name, check for duplicates
      if (updateData.name) {
        const existingLevel = await this.findOne({ 
          name: updateData.name, 
          is_active: true,
          _id: { $ne: levelId }
        });
        if (existingLevel) {
          throw new Error(`Influencer level '${updateData.name}' already exists`);
        }
      }

      return await this.updateById(levelId, updateData);
    } catch (error) {
      throw new Error(`Failed to update influencer level: ${error.message}`);
    }
  }

  // Get all influencer levels
  async getAllLevels() {
    try {
      return await this.findAll({ is_active: true }, { sort: { level_order: 1 } });
    } catch (error) {
      throw new Error(`Failed to get influencer levels: ${error.message}`);
    }
  }

  // Get level by name
  async getLevelByName(levelName) {
    try {
      return await this.findOne({ name: levelName, is_active: true });
    } catch (error) {
      throw new Error(`Failed to get influencer level: ${error.message}`);
    }
  }

  // Get level statistics
  async getLevelStats() {
    try {
      const stats = await this.aggregate([
        { $match: { is_active: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'name',
            foreignField: 'loyalty_tier',
            as: 'users'
          }
        },
        {
          $project: {
            name: 1,
            level_order: 1,
            required_referrals: 1,
            required_active_clients: 1,
            commission_rate: 1,
            auto_promotion: 1,
            benefits: 1,
            requirements: 1,
            user_count: { $size: '$users' }
          }
        },
        { $sort: { level_order: 1 } }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Failed to get level stats: ${error.message}`);
    }
  }

  // Get influencer promotion candidates
  async getPromotionCandidates() {
    try {
      const levels = await this.getAllLevels();
      const candidates = [];

      for (const level of levels) {
        const nextLevel = await this.findOne({ 
          level_order: level.level_order + 1, 
          is_active: true 
        });

        if (nextLevel) {
          const users = await this.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'name',
                foreignField: 'loyalty_tier',
                as: 'users'
              }
            },
            { $unwind: '$users' },
            {
              $match: {
                'users.role': 'influencer',
                'users.status': 'active'
              }
            },
            {
              $project: {
                user_id: '$users._id',
                user_name: { $concat: ['$users.first_name', ' ', '$users.last_name'] },
                current_level: '$name',
                next_level: nextLevel.name,
                referrals: { $ifNull: ['$users.referral_count', 0] },
                active_clients: { $ifNull: ['$users.active_clients', 0] },
                monthly_sales: { $ifNull: ['$users.monthly_sales', 0] },
                progress: {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ['$users.referral_count', 0] },
                        nextLevel.required_referrals
                      ]
                    },
                    100
                  ]
                }
              }
            },
            {
              $match: {
                $or: [
                  { referrals: { $gte: nextLevel.required_referrals } },
                  { active_clients: { $gte: nextLevel.required_active_clients } }
                ]
              }
            }
          ]);

          candidates.push(...users);
        }
      }

      return candidates;
    } catch (error) {
      throw new Error(`Failed to get promotion candidates: ${error.message}`);
    }
  }

  // Get overall influencer statistics
  async getInfluencerStats() {
    try {
      // Query users collection directly for influencers
      const User = require('./User');
      const userModel = new User();
      
      const influencers = await userModel.findAll({ 
        role: 'influencer', 
        status: 'active' 
      });

      const stats = {
        total_influencers: influencers.length,
        total_networks: influencers.reduce((sum, inf) => sum + (inf.referral_count || 0), 0),
        total_active_clients: influencers.reduce((sum, inf) => sum + (inf.active_clients || 0), 0),
        total_monthly_sales: influencers.reduce((sum, inf) => sum + (inf.monthly_sales || 0), 0),
        avg_commission: 0, // This would need to be calculated from commission data
        promotions_this_month: 0 // This would need to be calculated from promotion history
      };

      return stats;
    } catch (error) {
      console.error('Error in getInfluencerStats:', error);
      throw new Error(`Failed to get influencer stats: ${error.message}`);
    }
  }

  // Deactivate influencer level
  async deactivateLevel(levelId) {
    try {
      return await this.updateById(levelId, { 
        is_active: false,
        updated_at: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to deactivate influencer level: ${error.message}`);
    }
  }
}

module.exports = InfluencerLevel;