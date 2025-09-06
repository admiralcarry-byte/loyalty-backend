const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
  transaction_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'expired', 'adjusted', 'bonus', 'referral', 'campaign', 'refund'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  balance_before: {
    type: Number,
    required: true,
    min: 0
  },
  balance_after: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['purchase', 'referral', 'campaign', 'bonus', 'manual_adjustment', 'expiration', 'refund'],
    required: true
  },
  reference: {
    type: String,
    trim: true,
    maxlength: 100
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reference_model'
  },
  reference_model: {
    type: String,
    enum: ['Sale', 'Campaign', 'Commission', 'User', 'Product']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  metadata: {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    sale_amount: {
      type: Number,
      min: 0
    },
    points_per_liter: {
      type: Number,
      min: 0
    },
    multiplier: {
      type: Number,
      min: 1,
      default: 1
    },
    referral_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    expiration_date: Date,
    location: {
      type: String,
      trim: true
    },
    device: String,
    ip_address: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'expired'],
    default: 'completed'
  },
  expires_at: {
    type: Date
  },
  is_expired: {
    type: Boolean,
    default: false
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
    ref: 'User'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
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
// Index is automatically created by unique: true on transaction_number field
pointsTransactionSchema.index({ user: 1 });
pointsTransactionSchema.index({ type: 1 });
pointsTransactionSchema.index({ source: 1 });
pointsTransactionSchema.index({ status: 1 });
pointsTransactionSchema.index({ reference_id: 1 });
pointsTransactionSchema.index({ expires_at: 1 });
pointsTransactionSchema.index({ createdAt: -1 });

// Virtual for transaction value
pointsTransactionSchema.virtual('transaction_value').get(function() {
  return this.type === 'earned' ? this.points : -this.points;
});

// Virtual for is positive transaction
pointsTransactionSchema.virtual('is_positive').get(function() {
  return this.type === 'earned';
});

// Virtual for is negative transaction
pointsTransactionSchema.virtual('is_negative').get(function() {
  return this.type === 'spent' || this.type === 'expired';
});

// Virtual for days until expiration
pointsTransactionSchema.virtual('days_until_expiration').get(function() {
  if (!this.expires_at || this.is_expired) return 0;
  const now = new Date();
  const expirationDate = new Date(this.expires_at);
  const diffTime = expirationDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for formatted points
pointsTransactionSchema.virtual('formatted_points').get(function() {
  const sign = this.type === 'earned' ? '+' : '-';
  return `${sign}${this.points} points`;
});

// Pre-save middleware to generate transaction number if not provided
pointsTransactionSchema.pre('save', function(next) {
  if (this.isNew && !this.transaction_number) {
    this.transaction_number = this.generateTransactionNumber();
  }
  
  // Check if expired
  if (this.expires_at && !this.is_expired) {
    const now = new Date();
    this.is_expired = now > this.expires_at;
  }
  
  // Calculate balance after
  if (this.balance_before !== undefined && this.points !== undefined) {
    if (this.type === 'earned') {
      this.balance_after = this.balance_before + this.points;
    } else {
      this.balance_after = Math.max(0, this.balance_before - this.points);
    }
  }
  
  next();
});

// Instance method to generate transaction number
pointsTransactionSchema.methods.generateTransactionNumber = function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  const typePrefix = this.type.slice(0, 1).toUpperCase();
  return `PT${typePrefix}${year}${month}${timestamp}`;
};

// Instance method to check if transaction is valid
pointsTransactionSchema.methods.isValid = function() {
  if (this.status !== 'completed') return false;
  if (this.is_expired) return false;
  if (this.expires_at && new Date() > this.expires_at) return false;
  return true;
};

// Instance method to expire transaction
pointsTransactionSchema.methods.expire = function() {
  this.is_expired = true;
  this.status = 'expired';
  return this.save();
};

// Instance method to cancel transaction
pointsTransactionSchema.methods.cancel = function(cancelledBy, reason = '') {
  this.status = 'cancelled';
  this.notes = reason;
  return this.save();
};

// Static method to find by transaction number
pointsTransactionSchema.statics.findByTransactionNumber = function(transactionNumber) {
  return this.findOne({ transaction_number: transactionNumber.toUpperCase() });
};

// Static method to find transactions by user
pointsTransactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.source) {
    query.source = options.source;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find transactions by type
pointsTransactionSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ createdAt: -1 });
};

// Static method to find transactions by source
pointsTransactionSchema.statics.findBySource = function(source) {
  return this.find({ source }).sort({ createdAt: -1 });
};

// Static method to find expired transactions
pointsTransactionSchema.statics.findExpired = function() {
  const now = new Date();
  return this.find({
    expires_at: { $lt: now },
    is_expired: false,
    status: 'completed'
  });
};

// Static method to find transactions by reference
pointsTransactionSchema.statics.findByReference = function(referenceId, referenceModel) {
  return this.find({
    reference_id: referenceId,
    reference_model: referenceModel
  }).sort({ createdAt: -1 });
};

// Static method to get user points summary
pointsTransactionSchema.statics.getUserPointsSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_earned: { $sum: { $cond: [{ $eq: ['$type', 'earned'] }, '$points', 0] } },
        total_spent: { $sum: { $cond: [{ $eq: ['$type', 'spent'] }, '$points', 0] } },
        total_expired: { $sum: { $cond: [{ $eq: ['$type', 'expired'] }, '$points', 0] } },
        total_adjusted: { $sum: { $cond: [{ $eq: ['$type', 'adjusted'] }, '$points', 0] } },
        total_bonus: { $sum: { $cond: [{ $eq: ['$type', 'bonus'] }, '$points', 0] } },
        total_referral: { $sum: { $cond: [{ $eq: ['$type', 'referral'] }, '$points', 0] } },
        total_campaign: { $sum: { $cond: [{ $eq: ['$type', 'campaign'] }, '$points', 0] } },
        total_refund: { $sum: { $cond: [{ $eq: ['$type', 'refund'] }, '$points', 0] } },
        transaction_count: { $sum: 1 }
      }
    }
  ]);
  
  return summary[0] || {
    total_earned: 0,
    total_spent: 0,
    total_expired: 0,
    total_adjusted: 0,
    total_bonus: 0,
    total_referral: 0,
    total_campaign: 0,
    total_refund: 0,
    transaction_count: 0
  };
};

// Static method to get points transaction statistics
pointsTransactionSchema.statics.getPointsTransactionStats = async function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total_transactions: { $sum: 1 },
        total_points_earned: { $sum: { $cond: [{ $eq: ['$type', 'earned'] }, '$points', 0] } },
        total_points_spent: { $sum: { $cond: [{ $eq: ['$type', 'spent'] }, '$points', 0] } },
        total_points_expired: { $sum: { $cond: [{ $eq: ['$type', 'expired'] }, '$points', 0] } },
        total_points_adjusted: { $sum: { $cond: [{ $eq: ['$type', 'adjusted'] }, '$points', 0] } },
        total_points_bonus: { $sum: { $cond: [{ $eq: ['$type', 'bonus'] }, '$points', 0] } },
        total_points_referral: { $sum: { $cond: [{ $eq: ['$type', 'referral'] }, '$points', 0] } },
        total_points_campaign: { $sum: { $cond: [{ $eq: ['$type', 'campaign'] }, '$points', 0] } },
        total_points_refund: { $sum: { $cond: [{ $eq: ['$type', 'refund'] }, '$points', 0] } },
        net_points_change: { $sum: { $cond: [{ $eq: ['$type', 'earned'] }, '$points', -'$points'] } }
      }
    }
  ]);
  
  return stats[0] || {
    total_transactions: 0,
    total_points_earned: 0,
    total_points_spent: 0,
    total_points_expired: 0,
    total_points_adjusted: 0,
    total_points_bonus: 0,
    total_points_referral: 0,
    total_points_campaign: 0,
    total_points_refund: 0,
    net_points_change: 0
  };
};

module.exports = mongoose.model('PointsTransaction', pointsTransactionSchema); 