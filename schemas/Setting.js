const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['system', 'business', 'user', 'notification', 'payment', 'security', 'loyalty', 'general'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  is_public: {
    type: Boolean,
    default: false
  },
  is_editable: {
    type: Boolean,
    default: true
  },
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    min_value: Number,
    max_value: Number,
    pattern: String,
    allowed_values: [mongoose.Schema.Types.Mixed]
  },
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    last_modified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  }
}, {
  timestamps: true
});

// Index is automatically created by unique: true on key field
settingSchema.index({ category: 1 });
settingSchema.index({ is_public: 1 });

module.exports = mongoose.model('Setting', settingSchema); 