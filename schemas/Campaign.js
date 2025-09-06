const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['points_multiplier', 'cashback', 'discount', 'referral_bonus', 'seasonal', 'loyalty_tier'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  short_description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  activation_date: {
    type: Date
  },
  deactivation_date: {
    type: Date
  },
  rules: {
    minimum_purchase: {
      type: Number,
      min: 0,
      default: 0
    },
    maximum_discount: {
      type: Number,
      min: 0,
      default: 0
    },
    points_multiplier: {
      type: Number,
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
    applicable_products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicable_categories: [{
      type: String,
      enum: ['water', 'bottles', 'accessories', 'equipment', 'subscription']
    }],
    applicable_stores: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    }],
    applicable_user_tiers: [{
      type: String,
      enum: ['lead', 'silver', 'gold', 'platinum']
    }],
    usage_limit_per_user: {
      type: Number,
      min: 1,
      default: 1
    },
    total_usage_limit: {
      type: Number,
      min: 0
    }
  },
  targeting: {
    user_segments: [{
      type: String,
      enum: ['new_users', 'returning_users', 'high_value_users', 'inactive_users']
    }],
    geographic_regions: [{
      type: String,
      trim: true
    }],
    age_groups: [{
      type: String,
      enum: ['18-25', '26-35', '36-45', '46-55', '55+']
    }],
    purchase_history: {
      minimum_orders: {
        type: Number,
        min: 0,
        default: 0
      },
      minimum_spend: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  },
  budget: {
    total_budget: {
      type: Number,
      min: 0
    },
    spent_amount: {
      type: Number,
      min: 0,
      default: 0
    },
    remaining_budget: {
      type: Number,
      min: 0
    },
    cost_per_acquisition: {
      type: Number,
      min: 0
    }
  },
  performance: {
    total_enrollments: {
      type: Number,
      min: 0,
      default: 0
    },
    total_redemptions: {
      type: Number,
      min: 0,
      default: 0
    },
    total_revenue_generated: {
      type: Number,
      min: 0,
      default: 0
    },
    total_points_awarded: {
      type: Number,
      min: 0,
      default: 0
    },
    total_cashback_paid: {
      type: Number,
      min: 0,
      default: 0
    },
    conversion_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
  },
  creative: {
    banner_image: {
      url: String,
      alt_text: String
    },
    email_template: String,
    sms_template: String,
    push_notification: String,
    social_media_post: String
  },
  channels: [{
    type: String,
    enum: ['email', 'sms', 'push_notification', 'in_app', 'social_media', 'website', 'store_display']
  }],
  schedule: {
    send_time: {
      type: String,
      default: '09:00'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      default: 'once'
    },
    day_of_week: {
      type: Number,
      min: 0,
      max: 6
    },
    day_of_month: {
      type: Number,
      min: 1,
      max: 31
    }
  },
  tracking: {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_term: String,
    utm_content: String
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approval_notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Index is automatically created by unique: true on code field
campaignSchema.index({ status: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ start_date: 1 });
campaignSchema.index({ end_date: 1 });
campaignSchema.index({ 'rules.applicable_user_tiers': 1 });
campaignSchema.index({ 'targeting.user_segments': 1 });
campaignSchema.index({ createdAt: -1 });

// Virtual for campaign duration in days
campaignSchema.virtual('duration_days').get(function() {
  if (!this.start_date || !this.end_date) return 0;
  const diffTime = Math.abs(this.end_date - this.start_date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for campaign status based on dates
campaignSchema.virtual('date_status').get(function() {
  const now = new Date();
  if (now < this.start_date) return 'upcoming';
  if (now > this.end_date) return 'expired';
  return 'active';
});

// Virtual for budget utilization percentage
campaignSchema.virtual('budget_utilization').get(function() {
  if (!this.budget.total_budget) return 0;
  return Math.round((this.budget.spent_amount / this.budget.total_budget) * 100);
});

// Pre-save middleware to generate campaign code if not provided
campaignSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.generateCampaignCode();
  }
  
  // Calculate remaining budget
  if (this.budget.total_budget && this.budget.spent_amount !== undefined) {
    this.budget.remaining_budget = Math.max(0, this.budget.total_budget - this.budget.spent_amount);
  }
  
  next();
});

// Instance method to generate campaign code
campaignSchema.methods.generateCampaignCode = function() {
  const prefix = this.type.slice(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

// Instance method to check if campaign is active
campaignSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.start_date && 
         now <= this.end_date;
};

// Instance method to check if user is eligible
campaignSchema.methods.isUserEligible = function(user) {
  // Check user tier eligibility
  if (this.rules.applicable_user_tiers.length > 0 && 
      !this.rules.applicable_user_tiers.includes(user.loyalty_tier)) {
    return false;
  }
  
  // Check purchase history requirements
  if (this.targeting.purchase_history.minimum_orders > 0 && 
      user.total_purchases < this.targeting.purchase_history.minimum_orders) {
    return false;
  }
  
  if (this.targeting.purchase_history.minimum_spend > 0 && 
      user.total_purchases < this.targeting.purchase_history.minimum_spend) {
    return false;
  }
  
  return true;
};

// Static method to find by code
campaignSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to find active campaigns
campaignSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    start_date: { $lte: now },
    end_date: { $gte: now }
  });
};

// Static method to find campaigns by type
campaignSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'active' });
};

// Static method to find campaigns for user tier
campaignSchema.statics.findForUserTier = function(userTier) {
  return this.find({
    status: 'active',
    'rules.applicable_user_tiers': userTier
  });
};

// Static method to get campaign statistics
campaignSchema.statics.getCampaignStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_campaigns: { $sum: 1 },
        active_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        draft_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        completed_campaigns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        total_enrollments: { $sum: '$performance.total_enrollments' },
        total_redemptions: { $sum: '$performance.total_redemptions' },
        total_revenue: { $sum: '$performance.total_revenue_generated' },
        total_budget: { $sum: '$budget.total_budget' },
        total_spent: { $sum: '$budget.spent_amount' }
      }
    }
  ]);
  
  return stats[0] || {
    total_campaigns: 0,
    active_campaigns: 0,
    draft_campaigns: 0,
    completed_campaigns: 0,
    total_enrollments: 0,
    total_redemptions: 0,
    total_revenue: 0,
    total_budget: 0,
    total_spent: 0
  };
};

module.exports = mongoose.model('Campaign', campaignSchema); 