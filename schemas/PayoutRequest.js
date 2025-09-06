const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  request_number: {
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'GHS',
    maxlength: 3
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'pending'
  },
  bank_details: {
    account_name: {
      type: String,
      required: true,
      trim: true
    },
    account_number: {
      type: String,
      required: true,
      trim: true
    },
    bank_name: {
      type: String,
      required: true,
      trim: true
    },
    branch_code: {
      type: String,
      trim: true
    },
    bic: {
      type: String,
      trim: true
    }
  },
  commission_breakdown: {
    total_commission_earned: {
      type: Number,
      required: true,
      min: 0
    },
    previously_paid: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    pending_payout: {
      type: Number,
      required: true,
      min: 0
    }
  },
  approval: {
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requested_date: {
      type: Date,
      default: Date.now
    },
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
  payment: {
    payment_method: {
      type: String,
      enum: ['bank_transfer', 'mobile_money', 'cash', 'check'],
      default: 'bank_transfer'
    },
    payment_reference: String,
    payment_date: Date,
    transaction_id: String,
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  related_commissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission'
  }],
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'automatic', 'system_generated'],
      default: 'manual'
    },
    period_start: Date,
    period_end: Date,
    commission_type: {
      type: String,
      enum: ['monthly', 'weekly', 'quarterly', 'on_demand'],
      default: 'monthly'
    }
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
payoutRequestSchema.index({ user: 1 });
payoutRequestSchema.index({ status: 1 });
payoutRequestSchema.index({ 'approval.requested_date': -1 });
payoutRequestSchema.index({ 'approval.approved_date': -1 });
payoutRequestSchema.index({ createdAt: -1 });

// Virtual for formatted amount
payoutRequestSchema.virtual('formatted_amount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for days pending
payoutRequestSchema.virtual('days_pending').get(function() {
  if (this.status !== 'pending') return 0;
  const now = new Date();
  const requestedDate = new Date(this.approval.requested_date);
  const diffTime = now - requestedDate;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Pre-save middleware to generate request number if not provided
payoutRequestSchema.pre('save', function(next) {
  if (this.isNew && !this.request_number) {
    this.request_number = this.generateRequestNumber();
  }
  next();
});

// Instance method to generate request number
payoutRequestSchema.methods.generateRequestNumber = function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `PAY${year}${month}${timestamp}`;
};

// Instance method to approve payout request
payoutRequestSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approval.approved_by = approvedBy;
  this.approval.approved_date = new Date();
  this.approval.notes = notes;
  return this.save();
};

// Instance method to reject payout request
payoutRequestSchema.methods.reject = function(rejectedBy, reason = '') {
  this.status = 'rejected';
  this.approval.rejected_by = rejectedBy;
  this.approval.rejected_date = new Date();
  this.approval.rejection_reason = reason;
  return this.save();
};

// Instance method to mark as paid
payoutRequestSchema.methods.markAsPaid = function(paymentDetails, processedBy) {
  this.status = 'paid';
  this.payment.payment_date = new Date();
  this.payment.processed_by = processedBy;
  this.payment = { ...this.payment, ...paymentDetails };
  return this.save();
};

// Static method to find pending payout requests
payoutRequestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'first_name last_name email phone')
    .sort({ 'approval.requested_date': 1 });
};

// Static method to find payout requests by user
payoutRequestSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .populate('user', 'first_name last_name email phone')
    .sort({ createdAt: -1 });
};

// Static method to find payout requests by status
payoutRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('user', 'first_name last_name email phone')
    .populate('approval.approved_by', 'first_name last_name')
    .populate('approval.rejected_by', 'first_name last_name')
    .sort({ createdAt: -1 });
};

// Static method to get payout request statistics
payoutRequestSchema.statics.getPayoutStats = async function(startDate, endDate) {
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
        total_requests: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        pending_requests: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approved_requests: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        paid_requests: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        rejected_requests: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        pending_amount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        approved_amount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
        paid_amount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        rejected_amount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] } },
        average_amount: { $avg: '$amount' }
      }
    }
  ]);
  
  return stats[0] || {
    total_requests: 0,
    total_amount: 0,
    pending_requests: 0,
    approved_requests: 0,
    paid_requests: 0,
    rejected_requests: 0,
    pending_amount: 0,
    approved_amount: 0,
    paid_amount: 0,
    rejected_amount: 0,
    average_amount: 0
  };
};

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);