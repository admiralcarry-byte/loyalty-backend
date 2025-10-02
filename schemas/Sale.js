const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  sale_number: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  transaction_id: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: false,
    min: 0
  },
  subtotal: {
    type: Number,
    required: false,
    min: 0
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'AOA',
    enum: ['AOA', 'USD', 'EUR', 'BRL']
  },
  order_status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'in_transit', 'delivered'],
    default: 'completed'
  },
  points_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  cashback_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  loyalty_tier_at_purchase: {
    type: String,
    enum: ['lead', 'silver', 'gold', 'platinum'],
    default: 'lead'
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  referral_code: {
    type: String,
    trim: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  // Invoice-specific fields
  purchaser_name: {
    type: String,
    required: false,
    trim: true
  },
  purchaser_phone: {
    type: String,
    required: false,
    trim: true
  },
  purchaser_email: {
    type: String,
    required: false,
    trim: true
  },
  liters_purchased: {
    type: Number,
    required: false,
    min: 0
  },
  store_number: {
    type: String,
    required: false,
    trim: true
  },
  store_number_hash: {
    type: String,
    required: false,
    trim: true
  },
  qr_code_data: {
    type: String,
    required: false,
    trim: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'wallet', 'pix', 'mobile_money', 'credit_card', 'debit_card', 'points'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  items: [{
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
      default: 0,
      min: 0
    },
    liters: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  delivery_status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  delivery_address: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: String,
    coordinates: {
      type: [Number],
      validate: {
        validator: function(v) {
          return !v || (v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90);
        },
        message: 'Coordinates must be valid longitude and latitude values'
      }
    }
  },
  delivery_notes: {
    type: String,
    maxlength: 500
  },
  expected_delivery: {
    type: Date
  },
  actual_delivery: {
    type: Date
  },
  points_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  points_spent: {
    type: Number,
    default: 0,
    min: 0
  },
  total_liters: {
    type: Number,
    default: 0,
    min: 0
  },
  commission: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    calculated: {
      type: Boolean,
      default: false
    },
    tier: {
      type: String,
      enum: ['lead', 'silver', 'gold', 'platinum'],
      default: 'lead'
    },
    settings_used: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionSettings'
    }
  },
  referral: {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  metadata: {
    source: {
      type: String,
      enum: ['in_store', 'online', 'mobile_app', 'phone'],
      default: 'in_store'
    },
    device: String,
    ip_address: String,
    user_agent: String,
    commission_settings_snapshot: {
      base_rate: {
        type: Number,
        min: 0,
        max: 100
      },
      tier_multipliers: {
        lead: { type: Number, min: 0 },
        silver: { type: Number, min: 0 },
        gold: { type: Number, min: 0 },
        platinum: { type: Number, min: 0 }
      },
      commission_cap: {
        type: Number,
        min: 0
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: sale_number index is automatically created by unique: true
saleSchema.index({ user_id: 1, created_at: -1 });
saleSchema.index({ store_id: 1, created_at: -1 });
saleSchema.index({ product_id: 1, created_at: -1 });
saleSchema.index({ status: 1, created_at: -1 });
saleSchema.index({ payment_status: 1, created_at: -1 });
saleSchema.index({ created_at: -1 });
saleSchema.index({ 'delivery_address.coordinates': '2dsphere' });

// Virtual for profit (if cost data is available)
saleSchema.virtual('profit').get(function() {
  // This would need to be calculated based on product costs
  return 0;
});

// Virtual for margin percentage
saleSchema.virtual('margin_percentage').get(function() {
  if (this.subtotal === 0) return 0;
  return ((this.profit / this.subtotal) * 100).toFixed(2);
});

// Pre-save middleware to generate sale number if not provided
saleSchema.pre('save', function(next) {
  if (this.isNew && !this.sale_number) {
    this.sale_number = this.generateSaleNumber();
  }
  
  // Calculate totals if not set
  if (this.isNew || this.isModified('items')) {
    this.calculateTotals();
  }
  
  next();
});

// Instance method to generate sale number
saleSchema.methods.generateSaleNumber = function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `S${year}${month}${day}${timestamp}`;
};

// Instance method to calculate totals
saleSchema.methods.calculateTotals = function() {
  // Calculate subtotal from items (if items exist)
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Calculate total amount
    this.total_amount = this.subtotal - (this.discount || 0) + (this.tax || 0) + (this.delivery_fee || 0);
    
    // Calculate total liters
    this.total_liters = this.items.reduce((sum, item) => sum + (item.liters || 0), 0);
    
    // Calculate total points
    this.points_earned = this.items.reduce((sum, item) => sum + (item.points_earned || 0), 0);
  } else {
    // If no items, use existing values or defaults
    if (!this.subtotal && this.total_amount) {
      this.subtotal = this.total_amount;
    }
    if (!this.total_liters && this.liters_purchased) {
      this.total_liters = this.liters_purchased;
    }
  }
};

// Static method to find by sale number
saleSchema.statics.findBySaleNumber = function(saleNumber) {
  return this.findOne({ sale_number: saleNumber.toUpperCase() });
};

// Static method to find sales by customer
saleSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customer: customerId }).sort({ createdAt: -1 });
};

// Static method to find sales by store
saleSchema.statics.findByStore = function(storeId) {
  return this.find({ store: storeId }).sort({ createdAt: -1 });
};

// Static method to find sales by seller
saleSchema.statics.findBySeller = function(sellerId) {
  return this.find({ seller: sellerId }).sort({ createdAt: -1 });
};

// Static method to get sales statistics
saleSchema.statics.getSalesStats = async function(startDate, endDate) {
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
        total_sales: { $sum: 1 },
        total_revenue: { $sum: '$total_amount' },
        total_items: { $sum: { $size: '$items' } },
        total_liters: { $sum: '$total_liters' },
        total_points_earned: { $sum: '$points_earned' },
        total_points_spent: { $sum: '$points_spent' },
        average_order_value: { $avg: '$total_amount' }
      }
    }
  ]);
  
  return stats[0] || {
    total_sales: 0,
    total_revenue: 0,
    total_items: 0,
    total_liters: 0,
    total_points_earned: 0,
    total_points_spent: 0,
    average_order_value: 0
  };
};

module.exports = mongoose.model('Sale', saleSchema); 