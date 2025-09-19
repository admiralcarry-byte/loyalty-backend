const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    postal_code: {
      type: String,
      trim: true,
      maxlength: 20,
      validate: {
        validator: function(v) {
          return /^\d+$/.test(v);
        },
        message: 'Postal code must contain only numbers (store number)'
      }
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'Ghana'
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  manager: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  services: [{
    type: String,
    enum: ['water_delivery', 'bottle_exchange', 'subscription', 'bulk_orders', 'pickup']
  }],
  payment_methods: [{
    type: String,
    enum: ['cash', 'mobile_money', 'bank_transfer', 'credit_card', 'debit_card']
  }],
  commission_rate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  minimum_order: {
    type: Number,
    min: 0,
    default: 0
  },
  delivery_radius: {
    type: Number,
    min: 0,
    default: 0
  },
  delivery_fee: {
    type: Number,
    min: 0,
    default: 0
  },
  inventory: {
    total_bottles: {
      type: Number,
      min: 0,
      default: 0
    },
    available_bottles: {
      type: Number,
      min: 0,
      default: 0
    },
    reserved_bottles: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  performance: {
    total_sales: {
      type: Number,
      min: 0,
      default: 0
    },
    total_orders: {
      type: Number,
      min: 0,
      default: 0
    },
    average_order_value: {
      type: Number,
      min: 0,
      default: 0
    },
    customer_count: {
      type: Number,
      min: 0,
      default: 0
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
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: code index is automatically created by unique: true
storeSchema.index({ status: 1 });
storeSchema.index({ type: 1 });
storeSchema.index({ 'location.coordinates': '2dsphere' });
storeSchema.index({ 'address.city': 1 });
storeSchema.index({ 'address.state': 1 });
storeSchema.index({ createdAt: -1 });

// Virtual for full address
storeSchema.virtual('full_address').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postal_code}, ${addr.country}`;
});

// Virtual for is_open

// Pre-save middleware to generate store code if not provided
storeSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.generateStoreCode();
  }
  next();
});

// Instance method to generate store code
storeSchema.methods.generateStoreCode = function() {
  // Use store name prefix or default to 'ST' if name is not available
  const prefix = this.name ? this.name.slice(0, 2).toUpperCase() : 'ST';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

// Static method to find by code
storeSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to find active stores
storeSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find stores by type
storeSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'active' });
};

// Static method to find stores near location
storeSchema.statics.findNear = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active'
  });
};

module.exports = mongoose.model('Store', storeSchema); 