const mongoose = require('mongoose');

const loyaltyLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  tier: {
    type: String,
    required: true,
    enum: ['lead', 'silver', 'gold', 'platinum', 'diamond'],
    unique: true
  },
  level_number: {
    type: Number,
    required: true,
    min: 1,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  requirements: {
    minimum_liters: {
      type: Number,
      required: true,
      min: 0
    },
    minimum_points: {
      type: Number,
      required: true,
      min: 0
    },
    minimum_purchases: {
      type: Number,
      required: true,
      min: 0
    },
    minimum_spend: {
      type: Number,
      required: true,
      min: 0
    },
    minimum_referrals: {
      type: Number,
      required: true,
      min: 0
    },
    time_requirement: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Minimum months as customer'
    }
  },
  benefits: {
    points_multiplier: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    cashback_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    discount_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    referral_bonus: {
      type: Number,
      min: 0,
      default: 0
    },
    free_delivery: {
      type: Boolean,
      default: false
    },
    priority_support: {
      type: Boolean,
      default: false
    },
    exclusive_offers: {
      type: Boolean,
      default: false
    },
    birthday_bonus: {
      type: Number,
      min: 0,
      default: 0
    },
    anniversary_bonus: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  privileges: {
    can_refer_users: {
      type: Boolean,
      default: true
    },
    can_earn_commission: {
      type: Boolean,
      default: false
    },
    can_access_premium_features: {
      type: Boolean,
      default: false
    },
    can_participate_in_beta: {
      type: Boolean,
      default: false
    },
    can_access_analytics: {
      type: Boolean,
      default: false
    }
  },
  visual: {
    color: {
      type: String,
      default: '#000000'
    },
    icon: {
      type: String
    },
    badge: {
      type: String
    },
    gradient: {
      start_color: String,
      end_color: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  },
  auto_promotion: {
    enabled: {
      type: Boolean,
      default: true
    },
    check_frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    last_check: Date,
    promotion_rules: [{
      condition: {
        type: String,
        enum: ['liters', 'points', 'purchases', 'spend', 'referrals', 'time']
      },
      operator: {
        type: String,
        enum: ['gte', 'gt', 'lte', 'lt', 'eq']
      },
      value: Number,
      description: String
    }]
  },
  demotion: {
    enabled: {
      type: Boolean,
      default: false
    },
    grace_period_months: {
      type: Number,
      min: 0,
      default: 3
    },
    demotion_rules: [{
      condition: {
        type: String,
        enum: ['liters', 'points', 'purchases', 'spend', 'referrals', 'time']
      },
      operator: {
        type: String,
        enum: ['gte', 'gt', 'lte', 'lt', 'eq']
      },
      value: Number,
      description: String
    }]
  },
  statistics: {
    total_users: {
      type: Number,
      min: 0,
      default: 0
    },
    average_points_balance: {
      type: Number,
      min: 0,
      default: 0
    },
    average_liter_balance: {
      type: Number,
      min: 0,
      default: 0
    },
    average_monthly_spend: {
      type: Number,
      min: 0,
      default: 0
    },
    retention_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  metadata: {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    last_modified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version: {
      type: Number,
      default: 1
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Indexes are automatically created by unique: true on code, tier, and level_number fields
loyaltyLevelSchema.index({ status: 1 });
loyaltyLevelSchema.index({ 'requirements.minimum_liters': 1 });
loyaltyLevelSchema.index({ 'requirements.minimum_points': 1 });
loyaltyLevelSchema.index({ createdAt: -1 });

// Virtual for total requirements count
loyaltyLevelSchema.virtual('total_requirements').get(function() {
  return Object.keys(this.requirements).length;
});

// Virtual for total benefits count
loyaltyLevelSchema.virtual('total_benefits').get(function() {
  return Object.keys(this.benefits).length;
});

// Virtual for level difficulty (higher number = more difficult)
loyaltyLevelSchema.virtual('difficulty_score').get(function() {
  let score = 0;
  score += this.requirements.minimum_liters / 100;
  score += this.requirements.minimum_points / 1000;
  score += this.requirements.minimum_purchases / 10;
  score += this.requirements.minimum_spend / 1000;
  score += this.requirements.minimum_referrals * 2;
  score += this.requirements.time_requirement * 0.5;
  return Math.round(score * 10) / 10;
});

// Virtual for formatted requirements
loyaltyLevelSchema.virtual('formatted_requirements').get(function() {
  const reqs = [];
  if (this.requirements.minimum_liters > 0) {
    reqs.push(`${this.requirements.minimum_liters} liters`);
  }
  if (this.requirements.minimum_points > 0) {
    reqs.push(`${this.requirements.minimum_points} points`);
  }
  if (this.requirements.minimum_purchases > 0) {
    reqs.push(`${this.requirements.minimum_purchases} purchases`);
  }
  if (this.requirements.minimum_spend > 0) {
    reqs.push(`GHS ${this.requirements.minimum_spend}`);
  }
  if (this.requirements.minimum_referrals > 0) {
    reqs.push(`${this.requirements.minimum_referrals} referrals`);
  }
  if (this.requirements.time_requirement > 0) {
    reqs.push(`${this.requirements.time_requirement} months`);
  }
  return reqs.join(', ');
});

// Pre-save middleware to generate code if not provided
loyaltyLevelSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.generateLevelCode();
  }
  
  // Ensure level number matches tier
  if (this.isNew) {
    this.level_number = this.getLevelNumber();
  }
  
  next();
});

// Instance method to generate level code
loyaltyLevelSchema.methods.generateLevelCode = function() {
  const tierMap = { 'lead': 'L', 'silver': 'S', 'gold': 'G', 'platinum': 'P', 'diamond': 'D' };
  const prefix = tierMap[this.tier] || 'X';
  return `${prefix}${this.level_number}`;
};

// Instance method to get level number
loyaltyLevelSchema.methods.getLevelNumber = function() {
  const tierOrder = { 'lead': 1, 'silver': 2, 'gold': 3, 'platinum': 4, 'diamond': 5 };
  return tierOrder[this.tier] || 1;
};

// Instance method to check if user qualifies for this level
loyaltyLevelSchema.methods.checkEligibility = function(user) {
  const requirements = this.requirements;
  
  if (user.total_liters < requirements.minimum_liters) return false;
  if (user.points_balance < requirements.minimum_points) return false;
  if (user.total_purchases < requirements.minimum_purchases) return false;
  if (user.total_purchases < requirements.minimum_spend) return false;
  
  // Check referral count
  const referralCount = user.referral_count || 0;
  if (referralCount < requirements.minimum_referrals) return false;
  
  // Check time requirement
  if (requirements.time_requirement > 0) {
    const monthsAsCustomer = this.calculateMonthsAsCustomer(user.createdAt);
    if (monthsAsCustomer < requirements.time_requirement) return false;
  }
  
  return true;
};

// Instance method to calculate months as customer
loyaltyLevelSchema.methods.calculateMonthsAsCustomer = function(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  return diffMonths;
};

// Instance method to get next level
loyaltyLevelSchema.methods.getNextLevel = async function() {
  const nextLevelNumber = this.level_number + 1;
  return await this.constructor.findOne({ level_number: nextLevelNumber, status: 'active' });
};

// Instance method to get previous level
loyaltyLevelSchema.methods.getPreviousLevel = async function() {
  const prevLevelNumber = this.level_number - 1;
  return await this.constructor.findOne({ level_number: prevLevelNumber, status: 'active' });
};

// Static method to find by tier
loyaltyLevelSchema.statics.findByTier = function(tier) {
  return this.findOne({ tier, status: 'active' });
};

// Static method to find by code
loyaltyLevelSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to find active levels
loyaltyLevelSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ level_number: 1 });
};

// Static method to find levels by minimum requirements
loyaltyLevelSchema.statics.findByMinimumRequirements = function(criteria) {
  const query = { status: 'active' };
  
  if (criteria.liters) {
    query['requirements.minimum_liters'] = { $lte: criteria.liters };
  }
  if (criteria.points) {
    query['requirements.minimum_points'] = { $lte: criteria.points };
  }
  if (criteria.purchases) {
    query['requirements.minimum_purchases'] = { $lte: criteria.purchases };
  }
  if (criteria.spend) {
    query['requirements.minimum_spend'] = { $lte: criteria.spend };
  }
  
  return this.find(query).sort({ level_number: 1 });
};

// Static method to get loyalty level statistics
loyaltyLevelSchema.statics.getLoyaltyLevelStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_levels: { $sum: 1 },
        active_levels: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive_levels: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        deprecated_levels: { $sum: { $cond: [{ $eq: ['$status', 'deprecated'] }, 1, 0] } },
        total_users: { $sum: '$statistics.total_users' },
        average_points: { $avg: '$statistics.average_points_balance' },
        average_liters: { $avg: '$statistics.average_liter_balance' },
        average_spend: { $avg: '$statistics.average_monthly_spend' }
      }
    }
  ]);
  
  return stats[0] || {
    total_levels: 0,
    active_levels: 0,
    inactive_levels: 0,
    deprecated_levels: 0,
    total_users: 0,
    average_points: 0,
    average_liters: 0,
    average_spend: 0
  };
};

module.exports = mongoose.model('LoyaltyLevel', loyaltyLevelSchema); 