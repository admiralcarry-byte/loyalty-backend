const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
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
  first_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  last_name: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff', 'user', 'customer', 'influencer', 'seller'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  referral_code: {
    type: String,
    unique: true,
    sparse: true
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referred_by_phone: {
    type: String,
    sparse: true
  },
  loyalty_tier: {
    type: String,
    enum: ['lead', 'silver', 'gold', 'platinum'],
    default: 'lead'
  },
  points_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  liter_balance: {
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
  total_points_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  total_points_spent: {
    type: Number,
    default: 0,
    min: 0
  },
  last_login: {
    type: Date
  },
  profile_image: {
    type: String
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

// Virtual for full name
userSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Virtual for referral count
userSchema.virtual('referral_count').get(async function() {
  const count = await this.model('User').countDocuments({ referred_by: this._id });
  return count;
});

// Indexes
userSchema.index({ referred_by: 1 });
userSchema.index({ loyalty_tier: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate referral code
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.referral_code) {
    this.referral_code = this.generateReferralCode();
  }
  next();
});

// Instance method to verify password
userSchema.methods.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Instance method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

// Static method to find by referral code
userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referral_code: referralCode });
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_users: { $sum: 1 },
        active_users: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive_users: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        suspended_users: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        lead_users: { $sum: { $cond: [{ $eq: ['$loyalty_tier', 'lead'] }, 1, 0] } },
        silver_users: { $sum: { $cond: [{ $eq: ['$loyalty_tier', 'silver'] }, 1, 0] } },
        gold_users: { $sum: { $cond: [{ $eq: ['$loyalty_tier', 'gold'] }, 1, 0] } },
        platinum_users: { $sum: { $cond: [{ $eq: ['$loyalty_tier', 'platinum'] }, 1, 0] } },
        total_points: { $sum: '$points_balance' },
        total_liters: { $sum: '$liter_balance' },
        total_purchases: { $sum: '$total_purchases' }
      }
    }
  ]);
  
  return stats[0] || {
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    suspended_users: 0,
    lead_users: 0,
    silver_users: 0,
    gold_users: 0,
    platinum_users: 0,
    total_points: 0,
    total_liters: 0,
    total_purchases: 0
  };
};

module.exports = mongoose.model('User', userSchema); 