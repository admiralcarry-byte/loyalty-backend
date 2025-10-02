const mongoose = require('mongoose');

const commissionSettingsSchema = new mongoose.Schema({
  // Base commission configuration
  base_commission_rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 5.0
  },
  
  // Cashback rate configuration
  cashback_rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 2.0
  },
  
  // Tier multipliers for different loyalty levels
  tier_multipliers: {
    lead: {
      type: Number,
      required: true,
      min: 0,
      default: 1.0
    },
    silver: {
      type: Number,
      required: true,
      min: 0,
      default: 1.2
    },
    gold: {
      type: Number,
      required: true,
      min: 0,
      default: 1.5
    },
    platinum: {
      type: Number,
      required: true,
      min: 0,
      default: 2.0
    }
  },
  
  // User requirements
  minimum_active_users: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  
  // Payout configuration
  payout_threshold: {
    type: Number,
    required: true,
    min: 0,
    default: 50.0
  },
  
  payout_frequency: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'quarterly'],
    default: 'monthly'
  },
  
  // Commission calculation settings
  calculation_method: {
    type: String,
    required: true,
    enum: ['total_sales', 'net_sales', 'profit_margin'],
    default: 'total_sales'
  },
  
  // Minimum and maximum commission limits
  minimum_commission: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  maximum_commission: {
    type: Number,
    required: true,
    min: 0,
    default: 10000
  },
  
  // Status and metadata
  is_active: {
    type: Boolean,
    default: true
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes for efficient queries
commissionSettingsSchema.index({ is_active: 1 });
commissionSettingsSchema.index({ created_at: -1 });

// Static methods
commissionSettingsSchema.statics.getCurrentSettings = async function() {
  const settings = await this.findOne({ is_active: true })
    .populate('created_by', 'name email')
    .sort({ created_at: -1 });
  
  if (!settings) {
    // Return default settings if none exist
    return {
      base_commission_rate: 5.0,
      cashback_rate: 2.0,
      tier_multipliers: {
        lead: 1.0,
        silver: 1.2,
        gold: 1.5,
        platinum: 2.0
      },
      minimum_active_users: 10,
      payout_threshold: 50.0,
      payout_frequency: 'monthly',
      calculation_method: 'total_sales',
      minimum_commission: 0,
      maximum_commission: 10000,
      is_active: true
    };
  }
  
  return settings;
};

commissionSettingsSchema.statics.createNewSettings = async function(settingsData, userId) {
  // Deactivate current settings
  await this.updateMany({ is_active: true }, { is_active: false });
  
  // Create new settings
  const newSettings = new this({
    ...settingsData,
    created_by: userId,
    is_active: true
  });
  
  return await newSettings.save();
};

// Instance methods
commissionSettingsSchema.methods.calculateCommission = function(tier, salesAmount) {
  const multiplier = this.tier_multipliers[tier] || 1.0;
  const baseCommission = (salesAmount * this.base_commission_rate) / 100;
  const tierCommission = baseCommission * multiplier;
  
  // Apply minimum and maximum limits
  const finalCommission = Math.max(
    this.minimum_commission,
    Math.min(this.maximum_commission, tierCommission)
  );
  
  return Math.round(finalCommission * 100) / 100; // Round to 2 decimal places
};

commissionSettingsSchema.methods.meetsMinimumRequirements = function(activeUsers) {
  return activeUsers >= this.minimum_active_users;
};

module.exports = mongoose.model('CommissionSettings', commissionSettingsSchema, 'commissionsettings');