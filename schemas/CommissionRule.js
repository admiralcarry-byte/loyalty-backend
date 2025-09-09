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
    applicable_tiers: [{
      type: String,
      enum: ['lead', 'silver', 'gold', 'platinum']
    }],
    applicable_roles: [{
      type: String,
      enum: ['customer', 'influencer', 'manager', 'admin']
    }]
  },
  
  // Rule priority (higher number = higher priority)
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  
  // Rule validity period
  valid_from: {
    type: Date,
    default: Date.now
  },
  
  valid_until: {
    type: Date
  },
  
  // Metadata
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
commissionRuleSchema.index({ is_active: 1 });
commissionRuleSchema.index({ priority: -1 });
commissionRuleSchema.index({ created_at: -1 });
commissionRuleSchema.index({ name: 1 });

// Static methods
commissionRuleSchema.statics.getActiveRules = async function() {
  const now = new Date();
  return this.find({
    is_active: true,
    valid_from: { $lte: now },
    $or: [
      { valid_until: { $exists: false } },
      { valid_until: { $gte: now } }
    ]
  }).sort({ priority: -1, created_at: -1 });
};

commissionRuleSchema.statics.getAllRules = async function() {
  return this.find({})
    .populate('created_by', 'name email')
    .sort({ priority: -1, created_at: -1 });
};

// Instance methods
commissionRuleSchema.methods.calculateCommission = function(salesAmount, userTier = null) {
  if (!this.is_active) {
    return 0;
  }
  
  // Check if rule applies to user tier
  if (userTier && this.conditions.applicable_tiers.length > 0) {
    if (!this.conditions.applicable_tiers.includes(userTier)) {
      return 0;
    }
  }
  
  // Check validity period
  const now = new Date();
  if (now < this.valid_from || (this.valid_until && now > this.valid_until)) {
    return 0;
  }
  
  // Calculate commission based on type
  if (this.type === 'percentage') {
    return (salesAmount * this.rate) / 100;
  } else if (this.type === 'fixed') {
    return this.rate;
  }
  
  return 0;
};

commissionRuleSchema.methods.appliesTo = function(conditions) {
  // Check if rule is active
  if (!this.is_active) {
    return false;
  }
  
  // Check validity period
  const now = new Date();
  if (now < this.valid_from || (this.valid_until && now > this.valid_until)) {
    return false;
  }
  
  // Check user tier
  if (conditions.userTier && this.conditions.applicable_tiers.length > 0) {
    if (!this.conditions.applicable_tiers.includes(conditions.userTier)) {
      return false;
    }
  }
  
  // Check user role
  if (conditions.userRole && this.conditions.applicable_roles.length > 0) {
    if (!this.conditions.applicable_roles.includes(conditions.userRole)) {
      return false;
    }
  }
  
  // Check minimum sales
  if (conditions.salesAmount && this.conditions.minimum_sales > 0) {
    if (conditions.salesAmount < this.conditions.minimum_sales) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('CommissionRule', commissionRuleSchema, 'commissionrules');