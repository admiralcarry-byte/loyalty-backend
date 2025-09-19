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
  
  auto_approval: {
    type: Boolean,
    required: true,
    default: false
  },
  
  // Commission limits
  commission_cap: {
    type: Number,
    required: true,
    min: 0,
    default: 1000.0
  },
  
  // Metadata
  is_active: {
    type: Boolean,
    default: true
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient queries
commissionSettingsSchema.index({ is_active: 1 });
commissionSettingsSchema.index({ created_at: -1 });

// Static method to get current active settings
commissionSettingsSchema.statics.getCurrentSettings = async function() {
  try {
    const settings = await this.findOne({ is_active: true })
      .sort({ created_at: -1 });
    
    if (!settings) {
      // Return default settings if none exist
      return {
        base_commission_rate: 5.0,
        tier_multipliers: {
          lead: 1.0,
          silver: 1.2,
          gold: 1.5,
          platinum: 2.0
        },
        minimum_active_users: 10,
        payout_threshold: 50.0,
        payout_frequency: 'monthly',
        auto_approval: false,
        commission_cap: 1000.0,
        is_active: true
      };
    }
    
    return settings;
  } catch (error) {
    throw new Error(`Failed to get current commission settings: ${error.message}`);
  }
};

// Static method to create new settings (keeps old ones for historical purposes)
commissionSettingsSchema.statics.createNewSettings = async function(settingsData, userId) {
  try {
    // Deactivate only the currently active settings
    await this.updateMany({ is_active: true }, { is_active: false });
    
    // Create new settings
    const newSettings = new this({
      ...settingsData,
      created_by: userId,
      updated_by: userId,
      is_active: true
    });
    
    await newSettings.save();
    return newSettings;
  } catch (error) {
    throw new Error(`Failed to create new commission settings: ${error.message}`);
  }
};

// Static method to update current active settings
commissionSettingsSchema.statics.updateCurrentSettings = async function(settingsData, userId) {
  try {
    // Find the currently active settings
    const currentSettings = await this.findOne({ is_active: true });
    
    if (!currentSettings) {
      // If no active settings exist, create new ones
      return await this.createNewSettings(settingsData, userId);
    }
    
    // Update the existing active settings
    const updatedSettings = await this.findByIdAndUpdate(
      currentSettings._id,
      {
        ...settingsData,
        updated_by: userId,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );
    
    return updatedSettings;
  } catch (error) {
    throw new Error(`Failed to update current commission settings: ${error.message}`);
  }
};

// Instance method to calculate commission for a given tier and sales amount
commissionSettingsSchema.methods.calculateCommission = function(tier, salesAmount) {
  const tierKey = tier.toLowerCase();
  const multiplier = this.tier_multipliers[tierKey] || 1.0;
  const commission = (salesAmount * this.base_commission_rate * multiplier) / 100;
  
  // Apply commission cap
  return Math.min(commission, this.commission_cap);
};

// Instance method to check if user meets minimum requirements
commissionSettingsSchema.methods.meetsMinimumRequirements = function(activeUsers) {
  return activeUsers >= this.minimum_active_users;
};

// Static method to get settings that were active at a specific point in time
commissionSettingsSchema.statics.getSettingsAtTime = async function(timestamp) {
  try {
    // Find the most recent settings that were created at or before the timestamp
    const settings = await this.findOne({
      createdAt: { $lte: timestamp }
    })
      .sort({ createdAt: -1 });
    
    if (!settings) {
      // Return default settings if none exist
      return {
        base_commission_rate: 5.0,
        tier_multipliers: {
          lead: 1.0,
          silver: 1.2,
          gold: 1.5,
          platinum: 2.0
        },
        minimum_active_users: 10,
        payout_threshold: 50.0,
        payout_frequency: 'monthly',
        auto_approval: false,
        commission_cap: 1000.0,
        is_active: true
      };
    }
    
    return settings;
  } catch (error) {
    throw new Error(`Failed to get commission settings at time: ${error.message}`);
  }
};

module.exports = class CommissionSettings {
  constructor() {
    this.model = mongoose.model('CommissionSettings', commissionSettingsSchema);
  }
};