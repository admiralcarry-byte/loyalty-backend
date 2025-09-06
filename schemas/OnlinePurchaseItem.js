const mongoose = require('mongoose');

const onlinePurchaseItemSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OnlinePurchase',
    required: true
  },
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
}, {
  timestamps: true
});

onlinePurchaseItemSchema.index({ purchase: 1 });
onlinePurchaseItemSchema.index({ product: 1 });

module.exports = mongoose.model('OnlinePurchaseItem', onlinePurchaseItemSchema); 