const mongoose = require('mongoose');

const cashbackRuleSchema = new mongoose.Schema({
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
    enum: ['percentage', 'fixed', 'tiered', 'conditional'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  cashback_rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fixed_amount: {
    type: Number,
    min: 0
  },
  minimum_purchase: {
    type: Number,
    min: 0,
    default: 0
  },
  maximum_cashback: {
    type: Number,
    min: 0
  },
  applicable_products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicable_categories: [{
    type: String,
    enum: ['water', 'bottles', 'accessories', 'equipment', 'subscription']
  }],
  applicable_user_tiers: [{
    type: String,
    enum: ['lead', 'silver', 'gold', 'platinum', 'diamond']
  }],
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  usage_limit: {
    type: Number,
    min: 0
  },
  usage_count: {
    type: Number,
    min: 0,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index is automatically created by unique: true on code field
cashbackRuleSchema.index({ status: 1 });
cashbackRuleSchema.index({ start_date: 1 });
cashbackRuleSchema.index({ end_date: 1 });

module.exports = mongoose.model('CashbackRule', cashbackRuleSchema); 