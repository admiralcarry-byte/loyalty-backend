const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
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
    maxlength: 20
  },
  type: {
    type: String,
    enum: ['retail', 'wholesale', 'distributor', 'online'],
    default: 'retail'
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
      maxlength: 20
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'Ghana'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Coordinates must be valid longitude and latitude values'
      }
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
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200
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
  operating_hours: {
    monday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    saturday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    sunday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
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
storeSchema.virtual('is_open').get(function() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const time = now.toTimeString().slice(0, 5);
  
  const today = this.operating_hours[day];
  if (!today || today.closed) return false;
  
  return time >= today.open && time <= today.close;
});

// Pre-save middleware to generate store code if not provided
storeSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.generateStoreCode();
  }
  next();
});

// Instance method to generate store code
storeSchema.methods.generateStoreCode = function() {
  const prefix = this.type.slice(0, 2).toUpperCase();
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