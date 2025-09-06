const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  commission_number: {
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
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  type: {
    type: String,
    enum: ['sale_commission', 'referral_commission', 'bonus_commission', 'override_commission'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  base_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'GHS',
    maxlength: 3
  },
  calculation_details: {
    sale_amount: {
      type: Number,
      min: 0
    },
    commission_rate: {
      type: Number,
      min: 0,
      max: 100
    },
    tier_multiplier: {
      type: Number,
      min: 1,
      default: 1
    },
    bonus_amount: {
      type: Number,
      min: 0,
      default: 0
    },
    deductions: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  payment_details: {
    payment_method: {
      type: String,
      enum: ['bank_transfer', 'mobile_money', 'cash', 'check'],
      default: 'bank_transfer'
    },
    payment_reference: String,
    payment_date: Date,
    transaction_id: String,
    bank_details: {
      account_name: String,
      account_number: String,
      bank_name: String,
      branch_code: String
    },
    mobile_money_details: {
      provider: String,
      phone_number: String
    }
  },
  approval: {
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requested_date: Date,
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved_date: Date,
    rejected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejected_date: Date,
    rejection_reason: String,
    notes: String
  },
  schedule: {
    due_date: {
      type: Date,
      required: true
    },
    payment_date: Date,
    is_overdue: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'automatic', 'system_generated'],
      default: 'automatic'
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    product_category: String,
    sale_channel: String
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
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Index is automatically created by unique: true on commission_number field
commissionSchema.index({ user: 1 });
commissionSchema.index({ store: 1 });
commissionSchema.index({ sale: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ type: 1 });
commissionSchema.index({ 'schedule.due_date': 1 });
commissionSchema.index({ 'schedule.payment_date': 1 });
commissionSchema.index({ createdAt: -1 });

// Virtual for commission percentage
commissionSchema.virtual('commission_percentage').get(function() {
  if (this.base_amount === 0) return 0;
  return Math.round((this.amount / this.base_amount) * 100);
});

// Virtual for days overdue
commissionSchema.virtual('days_overdue').get(function() {
  if (!this.schedule.due_date || this.status === 'paid') return 0;
  const now = new Date();
  const dueDate = new Date(this.schedule.due_date);
  const diffTime = now - dueDate;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for total amount with currency
commissionSchema.virtual('formatted_amount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Pre-save middleware to generate commission number if not provided
commissionSchema.pre('save', function(next) {
  if (this.isNew && !this.commission_number) {
    this.commission_number = this.generateCommissionNumber();
  }
  
  // Check if overdue
  if (this.schedule.due_date && this.status !== 'paid') {
    const now = new Date();
    this.schedule.is_overdue = now > this.schedule.due_date;
  }
  
  next();
});

// Instance method to generate commission number
commissionSchema.methods.generateCommissionNumber = function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `COM${year}${month}${timestamp}`;
};

// Instance method to calculate commission amount
commissionSchema.methods.calculateCommission = function() {
  const baseAmount = this.base_amount || 0;
  const rate = this.rate || 0;
  const tierMultiplier = this.calculation_details.tier_multiplier || 1;
  const bonusAmount = this.calculation_details.bonus_amount || 0;
  const deductions = this.calculation_details.deductions || 0;
  
  this.amount = (baseAmount * rate / 100) * tierMultiplier + bonusAmount - deductions;
  this.amount = Math.max(0, this.amount);
  
  return this.amount;
};

// Instance method to approve commission
commissionSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approval.approved_by = approvedBy;
  this.approval.approved_date = new Date();
  this.approval.notes = notes;
  return this.save();
};

// Instance method to reject commission
commissionSchema.methods.reject = function(rejectedBy, reason = '') {
  this.status = 'rejected';
  this.approval.rejected_by = rejectedBy;
  this.approval.rejected_date = new Date();
  this.approval.rejection_reason = reason;
  return this.save();
};

// Instance method to mark as paid
commissionSchema.methods.markAsPaid = function(paymentDetails) {
  this.status = 'paid';
  this.schedule.payment_date = new Date();
  this.schedule.is_overdue = false;
  this.payment_details = { ...this.payment_details, ...paymentDetails };
  return this.save();
};

// Static method to find by commission number
commissionSchema.statics.findByCommissionNumber = function(commissionNumber) {
  return this.findOne({ commission_number: commissionNumber.toUpperCase() });
};

// Static method to find commissions by user
commissionSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find commissions by store
commissionSchema.statics.findByStore = function(storeId) {
  return this.find({ store: storeId }).sort({ createdAt: -1 });
};

// Static method to find pending commissions
commissionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ 'schedule.due_date': 1 });
};

// Static method to find overdue commissions
commissionSchema.statics.findOverdue = function() {
  return this.find({
    'schedule.is_overdue': true,
    status: { $in: ['pending', 'approved'] }
  }).sort({ 'schedule.due_date': 1 });
};

// Static method to find commissions by type
commissionSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ createdAt: -1 });
};

// Static method to find commissions by status
commissionSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get commission statistics
commissionSchema.statics.getCommissionStats = async function(startDate, endDate) {
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
        total_commissions: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        pending_amount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        approved_amount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
        paid_amount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        rejected_amount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] } },
        overdue_amount: { $sum: { $cond: ['$schedule.is_overdue', '$amount', 0] } },
        average_commission: { $avg: '$amount' }
      }
    }
  ]);
  
  return stats[0] || {
    total_commissions: 0,
    total_amount: 0,
    pending_amount: 0,
    approved_amount: 0,
    paid_amount: 0,
    rejected_amount: 0,
    overdue_amount: 0,
    average_commission: 0
  };
};

module.exports = mongoose.model('Commission', commissionSchema); 