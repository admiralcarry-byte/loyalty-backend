const mongoose = require('mongoose');

const InfluencerLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Silver', 'Gold', 'Platinum']
  },
  level_order: {
    type: Number,
    required: true,
    unique: true
  },
  required_referrals: {
    type: Number,
    required: true,
    min: 0
  },
  required_active_clients: {
    type: Number,
    required: true,
    min: 0
  },
  commission_rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  auto_promotion: {
    type: Boolean,
    default: true
  },
  benefits: [{
    type: String,
    required: true
  }],
  requirements: [{
    type: String,
    required: true
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
// Note: name and level_order indexes are automatically created by unique: true
InfluencerLevelSchema.index({ is_active: 1 });

// Static methods
InfluencerLevelSchema.statics.findByLevel = function(levelName) {
  return this.findOne({ name: levelName, is_active: true });
};

InfluencerLevelSchema.statics.getAllLevels = function() {
  return this.find({ is_active: true }).sort({ level_order: 1 });
};

InfluencerLevelSchema.statics.getLevelStats = function() {
  return this.aggregate([
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
        user_count: { $size: '$users' }
      }
    },
    { $sort: { level_order: 1 } }
  ]);
};

module.exports = mongoose.model('InfluencerLevel', InfluencerLevelSchema, 'influencerlevels');