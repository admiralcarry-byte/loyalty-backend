const mongoose = require('mongoose');

const onlinePurchaseSchema = new mongoose.Schema({
  order_number: {
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
  items: [{
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
    }
  }],
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  delivery_address: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index is automatically created by unique: true on order_number field
onlinePurchaseSchema.index({ user_id: 1, created_at: -1 });
onlinePurchaseSchema.index({ status: 1, created_at: -1 });
onlinePurchaseSchema.index({ payment_status: 1, created_at: -1 });
onlinePurchaseSchema.index({ created_at: -1 });

module.exports = mongoose.model('OnlinePurchase', onlinePurchaseSchema); 