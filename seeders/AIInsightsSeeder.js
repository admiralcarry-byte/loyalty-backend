const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * AI Insights seeder - Creates sample AI insights
 */
class AIInsightsSeeder extends BaseSeeder {
  async seed() {
    console.log('🤖 Seeding AI insights...');
    
    const existingCount = await this.getExistingCount('ai_insights');
    if (existingCount > 0) {
      console.log(`ℹ️  AI insights collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const aiInsights = [
      {
        type: 'customer_behavior',
        title: 'High-Value Customer Pattern Detected',
        description: 'Customers who purchase 5L bottles tend to make repeat purchases within 2 weeks',
        confidence_score: 0.87,
        data_source: 'sales_analytics',
        insights: {
          pattern: 'repeat_purchase_behavior',
          timeframe: '14_days',
          customer_segment: 'family_size_buyers',
          recommendation: 'target_with_subscription_offers'
        },
        impact_score: 0.75,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 86400000), // 1 day ago
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
      },
      {
        type: 'sales_forecast',
        title: 'Peak Sales Period Prediction',
        description: 'Sales are predicted to increase by 25% during the next 2 weeks',
        confidence_score: 0.82,
        data_source: 'historical_sales',
        insights: {
          predicted_increase: '25%',
          timeframe: '14_days',
          factors: ['seasonal_trend', 'marketing_campaigns', 'weather_patterns'],
          recommendation: 'increase_inventory_preparation'
        },
        impact_score: 0.90,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 172800000), // 2 days ago
        expires_at: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)) // 14 days from now
      },
      {
        type: 'churn_prediction',
        title: 'Customer Churn Risk Alert',
        description: '15 customers show high risk of churning in the next 30 days',
        confidence_score: 0.91,
        data_source: 'customer_activity',
        insights: {
          at_risk_customers: 15,
          risk_factors: ['decreased_purchase_frequency', 'no_recent_activity', 'complaint_history'],
          recommendation: 'implement_retention_campaign'
        },
        impact_score: 0.85,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 259200000), // 3 days ago
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
      },
      {
        type: 'product_recommendation',
        title: 'Cross-Sell Opportunity Identified',
        description: 'Customers buying 1L bottles often purchase sparkling water as well',
        confidence_score: 0.78,
        data_source: 'purchase_history',
        insights: {
          primary_product: '1L_bottles',
          recommended_product: 'sparkling_water',
          conversion_rate: '35%',
          recommendation: 'create_bundle_offer'
        },
        impact_score: 0.65,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 345600000), // 4 days ago
        expires_at: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)) // 60 days from now
      },
      {
        type: 'pricing_optimization',
        title: 'Dynamic Pricing Recommendation',
        description: 'Premium 1.5L bottles can support 8% price increase without affecting demand',
        confidence_score: 0.73,
        data_source: 'price_elasticity_analysis',
        insights: {
          product: 'premium_1.5L',
          recommended_increase: '8%',
          demand_impact: 'minimal',
          revenue_impact: '+12%',
          recommendation: 'implement_gradual_price_increase'
        },
        impact_score: 0.80,
        actionable: true,
        status: 'pending_review',
        created_at: new Date(Date.now() - 432000000), // 5 days ago
        expires_at: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)) // 45 days from now
      },
      {
        type: 'inventory_optimization',
        title: 'Stock Level Optimization',
        description: 'Benguela store needs 20% more inventory for 5L bottles',
        confidence_score: 0.85,
        data_source: 'inventory_analytics',
        insights: {
          store: 'Benguela',
          product: '5L_bottles',
          current_stock: '80%',
          recommended_stock: '100%',
          recommendation: 'increase_restock_frequency'
        },
        impact_score: 0.70,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 518400000), // 6 days ago
        expires_at: new Date(Date.now() + (21 * 24 * 60 * 60 * 1000)) // 21 days from now
      },
      {
        type: 'marketing_effectiveness',
        title: 'Campaign Performance Analysis',
        description: 'Email campaigns have 3x higher conversion rate than SMS campaigns',
        confidence_score: 0.88,
        data_source: 'marketing_analytics',
        insights: {
          email_conversion: '12%',
          sms_conversion: '4%',
          optimal_timing: 'weekday_mornings',
          recommendation: 'increase_email_budget'
        },
        impact_score: 0.75,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 604800000), // 7 days ago
        expires_at: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)) // 14 days from now
      },
      {
        type: 'customer_segmentation',
        title: 'New Customer Segment Identified',
        description: 'Health-conscious segment shows 40% higher lifetime value',
        confidence_score: 0.79,
        data_source: 'customer_analytics',
        insights: {
          segment_name: 'health_conscious',
          characteristics: ['premium_products', 'subscription_users', 'referral_active'],
          lifetime_value: '+40%',
          recommendation: 'create_health_focused_campaigns'
        },
        impact_score: 0.85,
        actionable: true,
        status: 'active',
        created_at: new Date(Date.now() - 691200000), // 8 days ago
        expires_at: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)) // 90 days from now
      },
      {
        type: 'operational_efficiency',
        title: 'Delivery Route Optimization',
        description: 'Route optimization can reduce delivery time by 15%',
        confidence_score: 0.76,
        data_source: 'logistics_analytics',
        insights: {
          current_avg_delivery_time: '45_minutes',
          optimized_avg_delivery_time: '38_minutes',
          fuel_savings: '12%',
          recommendation: 'implement_new_routing_algorithm'
        },
        impact_score: 0.70,
        actionable: true,
        status: 'pending_implementation',
        created_at: new Date(Date.now() - 777600000), // 9 days ago
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
      },
      {
        type: 'fraud_detection',
        title: 'Suspicious Activity Pattern',
        description: 'Unusual purchase pattern detected in online orders',
        confidence_score: 0.92,
        data_source: 'transaction_monitoring',
        insights: {
          pattern_type: 'rapid_successive_orders',
          risk_level: 'medium',
          affected_orders: 5,
          recommendation: 'manual_review_required'
        },
        impact_score: 0.95,
        actionable: true,
        status: 'under_review',
        created_at: new Date(Date.now() - 864000000), // 10 days ago
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days from now
      }
    ];

    await this.seedCollection('ai_insights', aiInsights, { clearFirst: false });
  }
}

module.exports = AIInsightsSeeder;