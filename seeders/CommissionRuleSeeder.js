const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Commission Rule seeder - Creates sample commission rules
 */
class CommissionRuleSeeder extends BaseSeeder {
  async seed() {
    console.log('📋 Seeding commission rules...');
    
    const existingCount = await this.getExistingCount('commissionrules');
    if (existingCount > 0) {
      console.log(`ℹ️  Commission rules collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const commissionRules = [
      {
        name: "High Volume Bonus",
        description: "Additional 2% commission for sales over $1000",
        rule_type: "volume_bonus",
        conditions: {
          min_sales_amount: 1000,
          min_volume: 50
        },
        commission_rate: 0.02,
        commission_type: "percentage",
        is_active: true,
        priority: 1,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year from now
        created_by: null, // Will be set to a user ID if available
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "New Customer Bonus",
        description: "Extra 5% commission for first-time customers",
        rule_type: "new_customer_bonus",
        conditions: {
          customer_type: "new",
          min_purchase_amount: 50
        },
        commission_rate: 0.05,
        commission_type: "percentage",
        is_active: true,
        priority: 2,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Weekend Special",
        description: "1.5% bonus commission on weekends",
        rule_type: "time_based_bonus",
        conditions: {
          day_of_week: ["saturday", "sunday"],
          min_sales_amount: 100
        },
        commission_rate: 0.015,
        commission_type: "percentage",
        is_active: true,
        priority: 3,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Premium Product Bonus",
        description: "3% extra commission for premium water products",
        rule_type: "product_bonus",
        conditions: {
          product_category: "premium",
          min_quantity: 10
        },
        commission_rate: 0.03,
        commission_type: "percentage",
        is_active: true,
        priority: 4,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Referral Bonus",
        description: "Fixed $10 bonus for each successful referral",
        rule_type: "referral_bonus",
        conditions: {
          referral_type: "successful",
          min_referral_value: 100
        },
        commission_rate: 10,
        commission_type: "fixed_amount",
        is_active: true,
        priority: 5,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Monthly Target Bonus",
        description: "2.5% bonus for reaching monthly sales target",
        rule_type: "target_bonus",
        conditions: {
          target_type: "monthly",
          min_target_achievement: 1.0
        },
        commission_rate: 0.025,
        commission_type: "percentage",
        is_active: true,
        priority: 6,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Seasonal Promotion",
        description: "1% bonus during summer season",
        rule_type: "seasonal_bonus",
        conditions: {
          season: "summer",
          min_sales_amount: 200
        },
        commission_rate: 0.01,
        commission_type: "percentage",
        is_active: true,
        priority: 7,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Team Performance Bonus",
        description: "1.5% bonus for team performance above 80%",
        rule_type: "team_bonus",
        conditions: {
          team_performance_threshold: 0.8,
          min_team_size: 3
        },
        commission_rate: 0.015,
        commission_type: "percentage",
        is_active: true,
        priority: 8,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Customer Retention Bonus",
        description: "2% bonus for repeat customers",
        rule_type: "retention_bonus",
        conditions: {
          customer_type: "repeat",
          min_previous_purchases: 2
        },
        commission_rate: 0.02,
        commission_type: "percentage",
        is_active: true,
        priority: 9,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Quality Assurance Bonus",
        description: "Fixed $5 bonus for zero complaint sales",
        rule_type: "quality_bonus",
        conditions: {
          complaint_count: 0,
          min_sales_amount: 50
        },
        commission_rate: 5,
        commission_type: "fixed_amount",
        is_active: true,
        priority: 10,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('commissionrules', commissionRules, { clearFirst: false });
  }
}

module.exports = CommissionRuleSeeder;