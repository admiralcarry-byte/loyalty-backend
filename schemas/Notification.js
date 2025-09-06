const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'promotion', 'system', 'transaction', 'referral'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['general', 'points', 'sales', 'campaigns', 'referrals', 'security', 'billing', 'support'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read_at: Date,
    delivered_at: Date,
    delivery_status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'read'],
      default: 'pending'
    }
  }],
  target_audience: {
    user_tiers: [{
      type: String,
      enum: ['lead', 'silver', 'gold', 'platinum', 'diamond']
    }],
    user_roles: [{
      type: String,
      enum: ['admin', 'manager', 'staff', 'user']
    }],
    specific_users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    all_users: {
      type: Boolean,
      default: false
    }
  },
  channels: [{
    type: String,
    enum: ['email', 'sms', 'push_notification', 'in_app', 'webhook'],
    required: true
  }],
  content: {
    email_subject: String,
    email_body: String,
    sms_text: String,
    push_title: String,
    push_body: String,
    in_app_content: String,
    webhook_payload: mongoose.Schema.Types.Mixed
  },
  scheduling: {
    send_immediately: {
      type: Boolean,
      default: true
    },
    scheduled_at: Date,
    expires_at: Date,
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  delivery: {
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft'
    },
    started_at: Date,
    completed_at: Date,
    total_recipients: {
      type: Number,
      min: 0,
      default: 0
    },
    delivered_count: {
      type: Number,
      min: 0,
      default: 0
    },
    failed_count: {
      type: Number,
      min: 0,
      default: 0
    },
    read_count: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  actions: [{
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    action_type: {
      type: String,
      enum: ['url', 'deep_link', 'api_call', 'modal', 'page_navigation'],
      required: true
    },
    action_value: {
      type: String,
      required: true
    },
    primary: {
      type: Boolean,
      default: false
    }
  }],
  metadata: {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  },
  settings: {
    allow_unsubscribe: {
      type: Boolean,
      default: true
    },
    require_confirmation: {
      type: Boolean,
      default: false
    },
    retry_on_failure: {
      type: Boolean,
      default: true
    },
    max_retry_attempts: {
      type: Number,
      min: 0,
      default: 3
    },
    retry_delay_minutes: {
      type: Number,
      min: 0,
      default: 5
    }
  },
  analytics: {
    open_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    click_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    conversion_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    engagement_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approval_notes: {
    type: String,
    maxlength: 500
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
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ 'delivery.status': 1 });
notificationSchema.index({ 'scheduling.scheduled_at': 1 });
notificationSchema.index({ 'scheduling.expires_at': 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for delivery progress percentage
notificationSchema.virtual('delivery_progress').get(function() {
  if (this.delivery.total_recipients === 0) return 0;
  return Math.round((this.delivery.delivered_count / this.delivery.total_recipients) * 100);
});

// Virtual for is expired
notificationSchema.virtual('is_expired').get(function() {
  if (!this.scheduling.expires_at) return false;
  return new Date() > this.scheduling.expires_at;
});

// Virtual for is scheduled
notificationSchema.virtual('is_scheduled').get(function() {
  return !this.scheduling.send_immediately && this.scheduling.scheduled_at;
});

// Virtual for can be sent
notificationSchema.virtual('can_be_sent').get(function() {
  if (this.delivery.status !== 'draft' && this.delivery.status !== 'scheduled') return false;
  if (this.is_expired) return false;
  if (this.is_scheduled && new Date() < this.scheduling.scheduled_at) return false;
  return true;
});

// Pre-save middleware to set delivery status
notificationSchema.pre('save', function(next) {
  if (this.isNew) {
    if (this.scheduling.send_immediately) {
      this.delivery.status = 'draft';
    } else if (this.scheduling.scheduled_at) {
      this.delivery.status = 'scheduled';
    }
  }
  
  // Calculate total recipients
  if (this.target_audience.all_users) {
    this.delivery.total_recipients = -1; // Will be calculated dynamically
  } else if (this.recipients.length > 0) {
    this.delivery.total_recipients = this.recipients.length;
  }
  
  next();
});

// Instance method to mark as read for a specific user
notificationSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient) {
    recipient.read_at = new Date();
    recipient.delivery_status = 'read';
    this.delivery.read_count = this.recipients.filter(r => r.delivery_status === 'read').length;
  }
  return this.save();
};

// Instance method to mark as delivered for a specific user
notificationSchema.methods.markAsDelivered = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient) {
    recipient.delivered_at = new Date();
    recipient.delivery_status = 'delivered';
    this.delivery.delivered_count = this.recipients.filter(r => r.delivery_status === 'delivered').length;
  }
  return this.save();
};

// Instance method to start delivery
notificationSchema.methods.startDelivery = function() {
  this.delivery.status = 'sending';
  this.delivery.started_at = new Date();
  return this.save();
};

// Instance method to complete delivery
notificationSchema.methods.completeDelivery = function() {
  this.delivery.status = 'sent';
  this.delivery.completed_at = new Date();
  return this.save();
};

// Instance method to fail delivery
notificationSchema.methods.failDelivery = function() {
  this.delivery.status = 'failed';
  this.delivery.completed_at = new Date();
  return this.save();
};

// Static method to find by type
notificationSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ createdAt: -1 });
};

// Static method to find by category
notificationSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ createdAt: -1 });
};

// Static method to find pending notifications
notificationSchema.statics.findPending = function() {
  return this.find({ 'delivery.status': 'draft' }).sort({ createdAt: 1 });
};

// Static method to find scheduled notifications
notificationSchema.statics.findScheduled = function() {
  const now = new Date();
  return this.find({
    'delivery.status': 'scheduled',
    'scheduling.scheduled_at': { $lte: now }
  }).sort({ 'scheduling.scheduled_at': 1 });
};

// Static method to find notifications for user
notificationSchema.statics.findForUser = function(userId, options = {}) {
  const query = {
    $or: [
      { 'recipients.user': userId },
      { 'target_audience.all_users': true },
      { 'target_audience.specific_users': userId }
    ]
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.unread_only) {
    query['recipients'] = {
      $elemMatch: {
        user: userId,
        read_at: { $exists: false }
      }
    };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = async function(startDate, endDate) {
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
        total_notifications: { $sum: 1 },
        total_recipients: { $sum: '$delivery.total_recipients' },
        total_delivered: { $sum: '$delivery.delivered_count' },
        total_failed: { $sum: '$delivery.failed_count' },
        total_read: { $sum: '$delivery.read_count' },
        average_open_rate: { $avg: '$analytics.open_rate' },
        average_click_rate: { $avg: '$analytics.click_rate' },
        average_engagement: { $avg: '$analytics.engagement_score' }
      }
    }
  ]);
  
  return stats[0] || {
    total_notifications: 0,
    total_recipients: 0,
    total_delivered: 0,
    total_failed: 0,
    total_read: 0,
    average_open_rate: 0,
    average_click_rate: 0,
    average_engagement: 0
  };
};

module.exports = mongoose.model('Notification', notificationSchema); 