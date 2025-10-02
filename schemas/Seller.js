const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },
  password_hash: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  store_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  total_sales: {
    type: Number,
    default: 0,
    min: 0
  },
  total_purchases: {
    type: Number,
    default: 0,
    min: 0
  },
  total_liters: {
    type: Number,
    default: 0,
    min: 0
  },
  total_customers: {
    type: Number,
    default: 0,
    min: 0
  },
  last_login: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  verification: {
    email_verified: { type: Boolean, default: false },
    phone_verified: { type: Boolean, default: false },
    email_verification_token: String,
    phone_verification_code: String,
    email_verification_expires: Date,
    phone_verification_expires: Date
  },
  security: {
    two_factor_enabled: { type: Boolean, default: false },
    two_factor_secret: String,
    login_attempts: { type: Number, default: 0 },
    lock_until: Date,
    password_changed_at: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
sellerSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Virtual for full name
sellerSchema.virtual('full_name').get(function() {
  return this.name;
});

// Indexes
sellerSchema.index({ email: 1 });
sellerSchema.index({ store_number: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ createdAt: -1 });
sellerSchema.index({ last_login: -1 });

module.exports = mongoose.model('Seller', sellerSchema);