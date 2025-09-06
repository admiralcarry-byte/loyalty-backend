const BaseModel = require('./BaseModel');
const AIInsightsSchema = require('../schemas/AIInsights');

class AIInsights extends BaseModel {
  constructor() {
    super(AIInsightsSchema);
  }

  // Create new AI insight
  async createAIInsight(insightData) {
    try {
      return await this.create(insightData);
    } catch (error) {
      throw new Error(`Failed to create AI insight: ${error.message}`);
    }
  }

  // Update AI insight
  async updateAIInsight(insightId, updateData) {
    try {
      return await this.updateById(insightId, updateData);
    } catch (error) {
      throw new Error(`Failed to update AI insight: ${error.message}`);
    }
  }

  // Get all AI insights with pagination and filters
  async getAllInsights(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        priority = 'all',
        category = 'all',
        status = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const query = { is_active: true };

      // Add filters
      if (priority !== 'all') {
        query.priority = priority;
      }
      if (category !== 'all') {
        query.category = category;
      }
      if (status !== 'all') {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [insights, total] = await Promise.all([
        this.find(query).sort(sort).skip(skip).limit(limit),
        this.countDocuments(query)
      ]);

      return {
        insights,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get AI insights: ${error.message}`);
    }
  }

  // Get top recommendations
  async getTopRecommendations(limit = 5) {
    try {
      return await this.find({ is_active: true })
        .sort({ ai_confidence: -1, priority: 1, created_at: -1 })
        .limit(limit);
    } catch (error) {
      throw new Error(`Failed to get top recommendations: ${error.message}`);
    }
  }

  // Get insights statistics
  async getInsightsStats() {
    try {
      const stats = await this.aggregate([
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
            in_progress: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            avg_confidence: { $avg: '$ai_confidence' },
            avg_user_engagement: { $avg: '$related_metrics.user_engagement' },
            avg_conversion_rate: { $avg: '$related_metrics.conversion_rate' }
          }
        }
      ]);

      const result = stats[0] || {
        total_recommendations: 0,
        high_priority: 0,
        medium_priority: 0,
        low_priority: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        avg_confidence: 0,
        avg_user_engagement: 0,
        avg_conversion_rate: 0
      };

      // Calculate implementation rate
      result.implementation_rate = result.total_recommendations > 0 
        ? Math.round((result.completed / result.total_recommendations) * 100)
        : 0;

      return result;
    } catch (error) {
      throw new Error(`Failed to get insights stats: ${error.message}`);
    }
  }

  // Get insights by priority
  async getInsightsByPriority(priority) {
    try {
      return await this.find({ priority, is_active: true }).sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Failed to get insights by priority: ${error.message}`);
    }
  }

  // Get insights by category
  async getInsightsByCategory(category) {
    try {
      return await this.find({ category, is_active: true }).sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Failed to get insights by category: ${error.message}`);
    }
  }

  // Update insight status
  async updateInsightStatus(insightId, status, implementationDate = null) {
    try {
      const updateData = { status };
      
      if (status === 'completed') {
        updateData.completion_date = new Date();
      }
      if (status === 'in_progress' && implementationDate) {
        updateData.implementation_date = implementationDate;
      }

      return await this.updateById(insightId, updateData);
    } catch (error) {
      throw new Error(`Failed to update insight status: ${error.message}`);
    }
  }

  // Generate AI insights (simulation)
  async generateAIInsights() {
    try {
      // This would typically call an AI service
      // For now, we'll simulate generating insights
      const sampleInsights = [
        {
          title: "Increase loyalty tier benefits",
          description: "Enhance benefits for higher-tier customers to improve retention rates",
          category: "Customer Retention",
          priority: "high",
          impact: "High Impact",
          tags: ["High Impact", "Customer Retention"],
          ai_confidence: 92,
          related_metrics: {
            user_engagement: 89,
            conversion_rate: 12.5,
            revenue_impact: 15
          }
        },
        {
          title: "Optimize commission structure",
          description: "Adjust commission rates to maximize influencer motivation",
          category: "Revenue Optimization",
          priority: "medium",
          impact: "Medium Impact",
          tags: ["Medium Impact", "Revenue Optimization"],
          ai_confidence: 87,
          related_metrics: {
            user_engagement: 85,
            conversion_rate: 10.2,
            revenue_impact: 8
          }
        },
        {
          title: "Enhance user onboarding",
          description: "Improve the first-time user experience to increase activation",
          category: "User Experience",
          priority: "low",
          impact: "Low Impact",
          tags: ["Low Impact", "User Experience"],
          ai_confidence: 78,
          related_metrics: {
            user_engagement: 82,
            conversion_rate: 8.5,
            revenue_impact: 5
          }
        }
      ];

      const createdInsights = [];
      for (const insight of sampleInsights) {
        const created = await this.create(insight);
        createdInsights.push(created);
      }

      return createdInsights;
    } catch (error) {
      throw new Error(`Failed to generate AI insights: ${error.message}`);
    }
  }

  // Deactivate AI insight
  async deactivateInsight(insightId) {
    try {
      return await this.updateById(insightId, { 
        is_active: false,
        updated_at: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to deactivate AI insight: ${error.message}`);
    }
  }
}

module.exports = AIInsights;