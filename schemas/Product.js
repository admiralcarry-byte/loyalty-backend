const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  category: {
    type: String,
    required: true,
    enum: ['fuel', 'water', 'bottles', 'accessories', 'equipment', 'subscription'],
    default: 'fuel'
  },
  type: {
    type: String,
    required: true,
    enum: ['premium_fuel', 'regular_fuel', 'diesel', 'bottled_water', 'dispenser', 'filter', 'bottle', 'subscription_plan'],
    default: 'premium_fuel'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  short_description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  price: {
    current: {
      type: Number,
      required: true,
      min: 0
    },
    original: {
      type: Number,
      min: 0
    },
    wholesale: {
      type: Number,
      min: 0
    },
    bulk: {
      type: Number,
      min: 0
    }
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'AOA',
    maxlength: 3
  },
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      min: 0,
      default: 0
    },
    minimum_stock: {
      type: Number,
      min: 0,
      default: 10
    },
    reorder_point: {
      type: Number,
      min: 0,
      default: 5
    },
    max_stock: {
      type: Number,
      min: 0
    }
  },
  specifications: {
    volume: {
      type: Number,
      min: 0
    },
         unit: {
       type: String,
       enum: ['ml', 'l', 'liter', 'g', 'kg', 'piece'],
       default: 'l'
     },
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    material: String,
    color: String,
    brand: String
  },
  water_properties: {
    ph_level: {
      type: Number,
      min: 0,
      max: 14
    },
    tds: {
      type: Number,
      min: 0
    },
    source: String,
    purification_method: String,
    mineral_content: {
      calcium: Number,
      magnesium: Number,
      sodium: Number,
      potassium: Number
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt_text: String,
    is_primary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'active'
  },
  availability: {
    in_stores: {
      type: Boolean,
      default: true
    },
    online: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: true
    },
    pickup: {
      type: Boolean,
      default: true
    }
  },
  points: {
    earn_rate: {
      type: Number,
      min: 0,
      default: 0
    },
    redemption_value: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  related_products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  average_rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  review_count: {
    type: Number,
    min: 0,
    default: 0
  },
  seo: {
    meta_title: String,
    meta_description: String,
    meta_keywords: [String],
    url_slug: {
      type: String,
      unique: true,
      sparse: true
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
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ type: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ 'inventory.quantity': 1 });
productSchema.index({ average_rating: -1 });
productSchema.index({ createdAt: -1 });

// Virtual for available quantity
productSchema.virtual('available_quantity').get(function() {
  return Math.max(0, this.inventory.quantity - this.inventory.reserved);
});

// Virtual for stock status
productSchema.virtual('stock_status').get(function() {
  if (this.inventory.quantity === 0) return 'out_of_stock';
  if (this.inventory.quantity <= this.inventory.reorder_point) return 'low_stock';
  if (this.inventory.quantity <= this.inventory.minimum_stock) return 'critical_stock';
  return 'in_stock';
});

// Virtual for discount percentage
productSchema.virtual('discount_percentage').get(function() {
  if (!this.price.original || this.price.original <= this.price.current) return 0;
  return Math.round(((this.price.original - this.price.current) / this.price.original) * 100);
});

// Virtual for profit margin
productSchema.virtual('profit_margin').get(function() {
  if (this.cost === 0 || this.price.current === 0) return 0;
  return Math.round(((this.price.current - this.cost) / this.price.current) * 100);
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (this.isNew && !this.sku) {
    this.sku = this.generateSKU();
  }
  
  // Update average rating and review count
  if (this.isModified('reviews')) {
    this.updateRatingStats();
  }
  
  next();
});

// Instance method to generate SKU
productSchema.methods.generateSKU = function() {
  const prefix = this.category.slice(0, 2).toUpperCase();
  const typePrefix = this.type.slice(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${typePrefix}${timestamp}`;
};

// Instance method to update rating statistics
productSchema.methods.updateRatingStats = function() {
  if (this.reviews.length === 0) {
    this.average_rating = 0;
    this.review_count = 0;
  } else {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.average_rating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.review_count = this.reviews.length;
  }
};

// Static method to find by SKU
productSchema.statics.findBySKU = function(sku) {
  return this.findOne({ sku: sku.toUpperCase() });
};

// Static method to find active products
productSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

// Static method to find products by type
productSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'active' });
};

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    'inventory.quantity': { $lte: '$inventory.reorder_point' },
    status: 'active'
  });
};

// Static method to search products
productSchema.statics.search = function(searchTerm, options = {}) {
  const searchQuery = {
    $text: { $search: searchTerm },
    status: 'active'
  };
  
  if (options.category) {
    searchQuery.category = options.category;
  }
  
  if (options.minPrice !== undefined) {
    searchQuery['price.current'] = { $gte: options.minPrice };
  }
  
  if (options.maxPrice !== undefined) {
    searchQuery['price.current'] = { ...searchQuery['price.current'], $lte: options.maxPrice };
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

module.exports = mongoose.model('Product', productSchema); 