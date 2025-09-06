const mongoose = require('mongoose');

const BankDetailsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bank_name: {
    type: String,
    required: true,
    trim: true
  },
  account_number: {
    type: String,
    required: true,
    trim: true
  },
  account_type: {
    type: String,
    required: true,
    enum: ['Conta Corrente', 'Conta Poupança', 'Conta Salário', 'Conta Empresarial'],
    default: 'Conta Corrente'
  },
  bank_code: {
    type: String,
    required: true,
    trim: true
  },
  branch_code: {
    type: String,
    required: true,
    trim: true
  },
  account_holder_name: {
    type: String,
    required: true,
    trim: true
  },
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verification_date: {
    type: Date,
    default: null
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejection_reason: {
    type: String,
    default: null
  },
  is_primary: {
    type: Boolean,
    default: false
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

// Index for efficient queries
BankDetailsSchema.index({ user_id: 1 });
BankDetailsSchema.index({ verification_status: 1 });
BankDetailsSchema.index({ bank_name: 1 });
BankDetailsSchema.index({ created_at: -1 });

// Virtual for masked account number
BankDetailsSchema.virtual('masked_account_number').get(function() {
  if (this.account_number && this.account_number.length >= 4) {
    return '****' + this.account_number.slice(-4);
  }
  return this.account_number;
});

// Ensure virtual fields are serialized
BankDetailsSchema.set('toJSON', { virtuals: true });
BankDetailsSchema.set('toObject', { virtuals: true });

// Static methods
BankDetailsSchema.statics.findByUserId = function(userId) {
  return this.find({ user_id: userId, is_active: true }).populate('user_id', 'first_name last_name email phone');
};

BankDetailsSchema.statics.findByVerificationStatus = function(status) {
  return this.find({ verification_status: status, is_active: true }).populate('user_id', 'first_name last_name email phone');
};

BankDetailsSchema.statics.getVerificationStats = function() {
  return this.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: '$verification_status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = BankDetailsSchema;