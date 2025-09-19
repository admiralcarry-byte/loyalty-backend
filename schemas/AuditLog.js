const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  entity_type: {
    type: String,
    required: true,
    enum: ['User', 'Store', 'Sale', 'Product', 'Campaign', 'Commission', 'LoyaltyLevel', 'PointsTransaction', 'Notification', 'Setting', 'System'],
    maxlength: 50
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_role: {
    type: String,
    enum: ['admin', 'manager', 'staff', 'user', 'system'],
    required: true
  },
  user_ip: {
    type: String,
    trim: true,
    maxlength: 45
  },
  user_agent: {
    type: String,
    trim: true,
    maxlength: 500
  },
  session_id: {
    type: String,
    trim: true,
    maxlength: 100
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields_changed: [{
      field: {
        type: String,
        required: true,
        trim: true
      },
      old_value: mongoose.Schema.Types.Mixed,
      new_value: mongoose.Schema.Types.Mixed,
      change_type: {
        type: String,
        enum: ['added', 'modified', 'removed'],
        required: true
      }
    }]
  },
  metadata: {
    request_id: {
      type: String,
      trim: true,
      maxlength: 100
    },
    endpoint: {
      type: String,
      trim: true,
      maxlength: 200
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      maxlength: 10
    },
    status_code: {
      type: Number,
      min: 100,
      max: 599
    },
    response_time: {
      type: Number,
      min: 0
    },
    request_body: mongoose.Schema.Types.Mixed,
    response_body: mongoose.Schema.Types.Mixed,
    query_params: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed
  },
  context: {
    module: {
      type: String,
      trim: true,
      maxlength: 100
    },
    sub_module: {
      type: String,
      trim: true,
      maxlength: 100
    },
    feature: {
      type: String,
      trim: true,
      maxlength: 100
    },
    business_process: {
      type: String,
      trim: true,
      maxlength: 100
    },
    workflow_step: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  related_logs: [{
    log_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditLog'
    },
    relationship: {
      type: String,
      enum: ['parent', 'child', 'related', 'caused_by', 'causes'],
      maxlength: 20
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entity_type: 1 });
auditLogSchema.index({ entity_id: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ user_role: 1 });
auditLogSchema.index({ risk_level: 1 });
auditLogSchema.index({ 'context.module': 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ 'metadata.request_id': 1 });
auditLogSchema.index({ 'metadata.endpoint': 1 });

// Virtual for action summary
auditLogSchema.virtual('action_summary').get(function() {
  return `${this.action} on ${this.entity_type} ${this.entity_id}`;
});

// Virtual for change summary
auditLogSchema.virtual('change_summary').get(function() {
  if (!this.changes.fields_changed || this.changes.fields_changed.length === 0) {
    return 'No field changes';
  }
  
  const changes = this.changes.fields_changed.map(change => {
    return `${change.field}: ${change.change_type}`;
  });
  
  return changes.join(', ');
});

// Virtual for is high risk
auditLogSchema.virtual('is_high_risk').get(function() {
  return this.risk_level === 'high' || this.risk_level === 'critical';
});

// Virtual for is system action
auditLogSchema.virtual('is_system_action').get(function() {
  return this.user_role === 'system';
});

// Virtual for has changes
auditLogSchema.virtual('has_changes').get(function() {
  return this.changes.fields_changed && this.changes.fields_changed.length > 0;
});

// Pre-save middleware to set default values
auditLogSchema.pre('save', function(next) {
  // Set default risk level based on action
  if (this.isNew && !this.risk_level) {
    this.risk_level = this.calculateRiskLevel();
  }
  
  // Set default context if not provided
  if (this.isNew && !this.context.module) {
    this.context.module = this.extractModuleFromEndpoint();
  }
  
  next();
});

// Instance method to calculate risk level
auditLogSchema.methods.calculateRiskLevel = function() {
  const highRiskActions = ['delete', 'remove', 'suspend', 'block', 'terminate', 'override'];
  const mediumRiskActions = ['update', 'modify', 'change', 'approve', 'reject', 'transfer'];
  
  if (highRiskActions.some(action => this.action.toLowerCase().includes(action))) {
    return 'high';
  }
  
  if (mediumRiskActions.some(action => this.action.toLowerCase().includes(action))) {
    return 'medium';
  }
  
  return 'low';
};

// Instance method to extract module from endpoint
auditLogSchema.methods.extractModuleFromEndpoint = function() {
  if (!this.metadata.endpoint) return 'unknown';
  
  const parts = this.metadata.endpoint.split('/').filter(part => part);
  return parts[0] || 'unknown';
};

// Instance method to add related log
auditLogSchema.methods.addRelatedLog = function(logId, relationship) {
  this.related_logs.push({
    log_id: logId,
    relationship: relationship
  });
  return this.save();
};

// Instance method to get change details for a specific field
auditLogSchema.methods.getFieldChange = function(fieldName) {
  if (!this.changes.fields_changed) return null;
  
  return this.changes.fields_changed.find(change => change.field === fieldName);
};

// Static method to find by entity
auditLogSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({
    entity_type: entityType,
    entity_id: entityId
  }).sort({ createdAt: -1 });
};

// Static method to find by user
auditLogSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find by action
auditLogSchema.statics.findByAction = function(action) {
  return this.find({ action }).sort({ createdAt: -1 });
};

// Static method to find by risk level
auditLogSchema.statics.findByRiskLevel = function(riskLevel) {
  return this.find({ risk_level: riskLevel }).sort({ createdAt: -1 });
};

// Static method to find high risk actions
auditLogSchema.statics.findHighRiskActions = function() {
  return this.find({
    risk_level: { $in: ['high', 'critical'] }
  }).sort({ createdAt: -1 });
};

// Static method to find by module
auditLogSchema.statics.findByModule = function(module) {
  return this.find({ 'context.module': module }).sort({ createdAt: -1 });
};

// Static method to find by date range
auditLogSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ createdAt: -1 });
};

// Static method to find by request ID
auditLogSchema.statics.findByRequestId = function(requestId) {
  return this.find({ 'metadata.request_id': requestId }).sort({ createdAt: -1 });
};

// Static method to get audit log statistics
auditLogSchema.statics.getAuditLogStats = async function(startDate, endDate) {
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
        total_logs: { $sum: 1 },
        unique_users: { $addToSet: '$user' },
        unique_entities: { $addToSet: { entity_type: '$entity_type', entity_id: '$entity_id' } },
        action_counts: { $push: '$action' },
        risk_level_counts: { $push: '$risk_level' },
        module_counts: { $push: '$context.module' }
      }
    },
    {
      $project: {
        total_logs: 1,
        unique_users: { $size: '$unique_users' },
        unique_entities: { $size: '$unique_entities' },
        action_counts: 1,
        risk_level_counts: 1,
        module_counts: 1
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total_logs: 0,
      unique_users: 0,
      unique_entities: 0,
      action_counts: {},
      risk_level_counts: {},
      module_counts: {}
    };
  }
  
  // Process action counts
  const actionCounts = {};
  stats[0].action_counts.forEach(action => {
    actionCounts[action] = (actionCounts[action] || 0) + 1;
  });
  
  // Process risk level counts
  const riskLevelCounts = {};
  stats[0].risk_level_counts.forEach(level => {
    riskLevelCounts[level] = (riskLevelCounts[level] || 0) + 1;
  });
  
  // Process module counts
  const moduleCounts = {};
  stats[0].module_counts.forEach(module => {
    if (module) {
      moduleCounts[module] = (moduleCounts[module] || 0) + 1;
    }
  });
  
  return {
    total_logs: stats[0].total_logs,
    unique_users: stats[0].unique_users,
    unique_entities: stats[0].unique_entities,
    action_counts: actionCounts,
    risk_level_counts: riskLevelCounts,
    module_counts: moduleCounts
  };
};

// Get audit statistics overview
auditLogSchema.statics.getAuditStats = async function(startDate, endDate) {
  const matchConditions = {};
  
  if (startDate && endDate) {
    matchConditions.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const pipeline = [
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_logs: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
        unique_actions: { $addToSet: '$action' },
        unique_modules: { $addToSet: '$module' },
        high_risk_logs: { $sum: { $cond: [{ $eq: ['$risk_level', 'high'] }, 1, 0] } },
        medium_risk_logs: { $sum: { $cond: [{ $eq: ['$risk_level', 'medium'] }, 1, 0] } },
        low_risk_logs: { $sum: { $cond: [{ $eq: ['$risk_level', 'low'] }, 1, 0] } }
      }
    },
    {
      $project: {
        total_logs: 1,
        unique_users_count: { $size: '$unique_users' },
        unique_actions_count: { $size: '$unique_actions' },
        unique_modules_count: { $size: '$unique_modules' },
        high_risk_logs: 1,
        medium_risk_logs: 1,
        low_risk_logs: 1
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    total_logs: 0,
    unique_users_count: 0,
    unique_actions_count: 0,
    unique_modules_count: 0,
    high_risk_logs: 0,
    medium_risk_logs: 0,
    low_risk_logs: 0
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 