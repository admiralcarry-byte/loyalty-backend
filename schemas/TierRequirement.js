const mongoose = require('mongoose');

const tierRequirementSchema = new mongoose.Schema({
  tier: {
    type: String,
    required: true,
    enum: ['lead', 'silver', 'gold', 'platinum'],
    unique: true
  },
  minimum_liters: {
    type: Number,
    required: true,
    min: 0
  },
  display_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  icon: {
    type: String,
    default: 'star'
  },
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

// Indexes
tierRequirementSchema.index({ tier: 1 });
tierRequirementSchema.index({ minimum_liters: 1 });
tierRequirementSchema.index({ is_active: 1 });

// Static methods
tierRequirementSchema.statics.getActiveRequirements = async function() {
  return this.find({ is_active: true }).sort({ minimum_liters: 1 });
};

tierRequirementSchema.statics.getTierForLiters = async function(totalLiters) {
  const requirements = await this.getActiveRequirements();
  
  let currentTier = 'lead';
  for (const req of requirements) {
    if (totalLiters >= req.minimum_liters) {
      currentTier = req.tier;
    } else {
      break;
    }
  }
  
  return currentTier;
};

module.exports = mongoose.model('TierRequirement', tierRequirementSchema, 'tierrequirements');