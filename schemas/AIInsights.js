const mongoose = require('mongoose');

const AIInsightsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Customer Retention', 'Revenue Optimization', 'User Experience', 'Marketing', 'Conversion', 'Operations'],
    default: 'Operations'
  },
  priority: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  impact: {
    type: String,
    required: true,
    enum: ['High Impact', 'Medium Impact', 'Low Impact'],
    default: 'Medium Impact'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  implementation_date: {
    type: Date,
    default: null
  },
  completion_date: {
    type: Date,
    default: null
  },
  estimated_effort: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  estimated_impact: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  tags: [{
    type: String,
    trim: true
  }],
  ai_confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 85
  },
  generated_by: {
    type: String,
    enum: ['ai_analytics', 'ai_content', 'manual'],
    default: 'ai_analytics'
  },
  related_metrics: {
    user_engagement: {
      type: Number,
      default: 0
    },
    conversion_rate: {
      type: Number,
      default: 0
    },
    revenue_impact: {
      type: Number,
      default: 0
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
AIInsightsSchema.index({ priority: 1 });
AIInsightsSchema.index({ category: 1 });
AIInsightsSchema.index({ status: 1 });
AIInsightsSchema.index({ created_at: -1 });
AIInsightsSchema.index({ ai_confidence: -1 });

// Static methods
AIInsightsSchema.statics.findByPriority = function(priority) {
  return this.find({ priority, is_active: true }).sort({ created_at: -1 });
};

AIInsightsSchema.statics.findByCategory = function(category) {
  return this.find({ category, is_active: true }).sort({ created_at: -1 });
};

AIInsightsSchema.statics.getInsightsStats = function() {
  return this.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: null,
        total_recommendations: { $sum: 1 },
        high_priority: {
          $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
        },
        medium_priority: {
          $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
        },
        low_priority: {
          $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avg_confidence: { $avg: '$ai_confidence' },
        avg_user_engagement: { $avg: '$related_metrics.user_engagement' },
        avg_conversion_rate: { $avg: '$related_metrics.conversion_rate' }
      }
    }
  ]);
};

AIInsightsSchema.statics.getTopRecommendations = function(limit = 5) {
  return this.find({ is_active: true })
    .sort({ ai_confidence: -1, priority: 1, created_at: -1 })
    .limit(limit);
};

module.exports = AIInsightsSchema;