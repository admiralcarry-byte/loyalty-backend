const mongoose = require('mongoose');

const purchaseEntrySchema = new mongoose.Schema({
  entry_number: {
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
    ref: 'Store',
    required: true
  },
  products: [{
    product: {
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
  entry_date: {
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

// Index is automatically created by unique: true on entry_number field
purchaseEntrySchema.index({ user: 1 });
purchaseEntrySchema.index({ store: 1 });
purchaseEntrySchema.index({ status: 1 });
purchaseEntrySchema.index({ entry_date: 1 });

module.exports = mongoose.model('PurchaseEntry', purchaseEntrySchema); 