const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchase_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  products: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0
    },
    total_price: {
      type: Number,
      required: true,
      min: 0
    },
    points_earned: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  total_liters: {
    type: Number,
    min: 0,
    default: 0
  },
  total_points: {
    type: Number,
    min: 0,
    default: 0
  },
  payment_method: {
    type: String,
    enum: ['cash', 'mobile_money', 'bank_transfer', 'credit_card', 'debit_card', 'points'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  purchase_date: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for frequently queried fields
// Note: purchase_number index is already created by unique: true in schema
purchaseSchema.index({ user_id: 1, created_at: -1 });
purchaseSchema.index({ store_id: 1, created_at: -1 });
purchaseSchema.index({ status: 1, created_at: -1 });
purchaseSchema.index({ purchase_date: 1 });
purchaseSchema.index({ created_at: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);