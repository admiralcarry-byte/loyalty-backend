const mongoose = require('mongoose');

const commissionRuleSchema = new mongoose.Schema({
  // Basic rule information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Rule configuration
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 1000 // Allow up to 1000% or $1000 fixed amount
  },
  
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  
  // Rule status and conditions
  is_active: {
    type: Boolean,
    default: true
  },
  
  // Rule conditions (for future use)
  conditions: {
    minimum_sales: {
      type: Number,
      default: 0
    },
    minimum_users: {
      type: Number,
      default: 0
    },
    minimum_growth: {
      type: Number,
      default: 0
    },
    tier_restrictions: [{
      type: String,
      enum: ['lead', 'silver', 'gold', 'platinum']
    }]
  },
  
  // Rule priority (for calculation order)
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Metadata
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
commissionRuleSchema.index({ is_active: 1 });
commissionRuleSchema.index({ priority: -1 });
commissionRuleSchema.index({ created_at: -1 });
commissionRuleSchema.index({ name: 1 });

// Static method to get all active rules ordered by priority
commissionRuleSchema.statics.getActiveRules = async function() {
  try {
    const rules = await this.find({ is_active: true })
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .sort({ priority: -1, created_at: -1 });
    
    return rules;
  } catch (error) {
    throw new Error(`Failed to get active commission rules: ${error.message}`);
  }
};

// Static method to get all rules (active and inactive)
commissionRuleSchema.statics.getAllRules = async function() {
  try {
    const rules = await this.find()
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .sort({ priority: -1, created_at: -1 });
    
    return rules;
  } catch (error) {
    throw new Error(`Failed to get all commission rules: ${error.message}`);
  }
};

// Instance method to calculate commission for this rule
commissionRuleSchema.methods.calculateCommission = function(salesAmount, userTier = null) {
  // Check if rule applies to this tier
  if (this.conditions.tier_restrictions.length > 0 && userTier) {
    if (!this.conditions.tier_restrictions.includes(userTier.toLowerCase())) {
      return 0;
    }
  }
  
  // Check minimum conditions
  if (this.conditions.minimum_sales > 0 && salesAmount < this.conditions.minimum_sales) {
    return 0;
  }
  
  // Calculate commission based on type
  if (this.type === 'percentage') {
    return (salesAmount * this.rate) / 100;
  } else {
    // Fixed amount
    return this.rate;
  }
};

// Instance method to check if rule applies to given conditions
commissionRuleSchema.methods.appliesTo = function(conditions) {
  const { salesAmount, userTier, networkSize, growthRate } = conditions;
  
  // Check tier restrictions
  if (this.conditions.tier_restrictions.length > 0 && userTier) {
    if (!this.conditions.tier_restrictions.includes(userTier.toLowerCase())) {
      return false;
    }
  }
  
  // Check minimum sales
  if (this.conditions.minimum_sales > 0 && salesAmount < this.conditions.minimum_sales) {
    return false;
  }
  
  // Check minimum users
  if (this.conditions.minimum_users > 0 && networkSize < this.conditions.minimum_users) {
    return false;
  }
  
  // Check minimum growth
  if (this.conditions.minimum_growth > 0 && growthRate < this.conditions.minimum_growth) {
    return false;
  }
  
  return true;
};

module.exports = class CommissionRule {
  constructor() {
    this.model = mongoose.model('CommissionRule', commissionRuleSchema);
  }
};