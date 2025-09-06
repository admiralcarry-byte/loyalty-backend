const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info',
    required: true
  },
  ip_address: {
    type: String,
    maxlength: 45
  },
  user_agent: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  collection: 'activity_logs'
});

// Add indexes for better performance
activityLogSchema.index({ user_id: 1 });
activityLogSchema.index({ created_at: -1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ user_id: 1, created_at: -1 });

// Pre-save middleware to ensure proper data formatting
activityLogSchema.pre('save', function(next) {
  // Let Mongoose handle timestamps automatically
  next();
});

// Static method to get paginated activity logs
activityLogSchema.statics.getPaginatedLogs = async function(params = {}) {
  const {
    page = 1,
    limit = 10,
    user_id,
    status,
    start_date,
    end_date
  } = params;

  const skip = (page - 1) * limit;
  const conditions = {};

  if (user_id) {
    conditions.user_id = user_id;
  }

  if (status) {
    conditions.status = status;
  }

  if (start_date || end_date) {
    conditions.created_at = {};
    if (start_date) {
      conditions.created_at.$gte = new Date(start_date);
    }
    if (end_date) {
      conditions.created_at.$lte = new Date(end_date);
    }
  }

  const [activities, totalCount] = await Promise.all([
    this.find(conditions)
      .populate('user_id', 'first_name last_name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec(),
    this.countDocuments(conditions)
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    activities,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);