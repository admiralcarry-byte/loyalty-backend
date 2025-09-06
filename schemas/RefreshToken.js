const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  is_revoked: {
    type: Boolean,
    default: false
  },
  device_info: {
    user_agent: String,
    ip_address: String,
    device_type: String
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index is automatically created by unique: true on token field
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expires_at: 1 });
refreshTokenSchema.index({ is_revoked: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema); 