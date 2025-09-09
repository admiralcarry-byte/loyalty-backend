const BaseSeeder = require('./BaseSeeder');

/**
 * Cashback Rule seeder - Creates sample cashback rules
 */
class CashbackRuleSeeder extends BaseSeeder {
  async seed() {
    console.log('💸 Seeding cashback rules...');
    
    const existingCount = await this.getExistingCount('cashbackrules');
    if (existingCount > 0) {
      console.log(`ℹ️  Cashback rules collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const cashbackRules = [
      {
        code: 'STD_CASHBACK_001',
        name: 'Standard Purchase Cashback',
        description: 'Standard cashback for all purchases',
        type: 'percentage',
        value: 5.0,
        min_purchase_amount: 10.0,
        max_cashback_amount: 50.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['lead', 'silver', 'gold', 'platinum'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 1,
        conditions: {
          payment_methods: ['cash', 'mobile_money', 'bank_transfer', 'credit_card'],
          min_quantity: 1,
          max_uses_per_user: null,
          max_uses_total: null
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'PREM_BONUS_002',
        name: 'Premium Product Bonus',
        description: 'Extra cashback for premium water products',
        type: 'percentage',
        value: 8.0,
        min_purchase_amount: 20.0,
        max_cashback_amount: 100.0,
        applicable_products: ['premium_500ml', 'premium_1.5l'],
        applicable_user_tiers: ['silver', 'gold', 'platinum'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 2,
        conditions: {
          payment_methods: ['mobile_money', 'bank_transfer', 'credit_card'],
          min_quantity: 2,
          max_uses_per_user: 5,
          max_uses_total: 1000
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'FAMILY_DISC_003',
        name: 'Family Size Discount',
        description: 'Special cashback for family size purchases',
        type: 'fixed',
        value: 3.0,
        min_purchase_amount: 15.0,
        max_cashback_amount: 3.0,
        applicable_products: ['family_5l'],
        applicable_user_tiers: ['all'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 3,
        conditions: {
          payment_methods: ['all'],
          min_quantity: 1,
          max_uses_per_user: 10,
          max_uses_total: 5000
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'SUB_CASHBACK_004',
        name: 'Subscription Cashback',
        description: 'Cashback for subscription purchases',
        type: 'percentage',
        value: 10.0,
        min_purchase_amount: 25.0,
        max_cashback_amount: 200.0,
        applicable_products: ['subscription_monthly'],
        applicable_user_tiers: ['gold', 'platinum'],
        applicable_stores: ['online'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 4,
        conditions: {
          payment_methods: ['bank_transfer', 'credit_card'],
          min_quantity: 1,
          max_uses_per_user: 1,
          max_uses_total: 500
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'FIRST_BONUS_005',
        name: 'First Purchase Bonus',
        description: 'Extra cashback for first-time customers',
        type: 'percentage',
        value: 15.0,
        min_purchase_amount: 5.0,
        max_cashback_amount: 25.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['lead'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 5,
        conditions: {
          payment_methods: ['all'],
          min_quantity: 1,
          max_uses_per_user: 1,
          max_uses_total: 10000,
          is_first_purchase: true
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'WEEKEND_SPEC_006',
        name: 'Weekend Special',
        description: 'Weekend cashback promotion',
        type: 'percentage',
        value: 7.0,
        min_purchase_amount: 12.0,
        max_cashback_amount: 35.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['all'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 6,
        conditions: {
          payment_methods: ['all'],
          min_quantity: 1,
          max_uses_per_user: 2,
          max_uses_total: null,
          valid_days: ['saturday', 'sunday']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'BULK_REWARD_007',
        name: 'Bulk Purchase Reward',
        description: 'Cashback for bulk purchases',
        type: 'percentage',
        value: 12.0,
        min_purchase_amount: 50.0,
        max_cashback_amount: 150.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['gold', 'platinum'],
        applicable_stores: ['wholesale', 'online'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 7,
        conditions: {
          payment_methods: ['bank_transfer', 'credit_card'],
          min_quantity: 10,
          max_uses_per_user: 3,
          max_uses_total: 2000
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'REFERRAL_CB_008',
        name: 'Referral Cashback',
        description: 'Cashback for successful referrals',
        type: 'fixed',
        value: 5.0,
        min_purchase_amount: 0.0,
        max_cashback_amount: 5.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['all'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 8,
        conditions: {
          payment_methods: ['all'],
          min_quantity: 0,
          max_uses_per_user: 20,
          max_uses_total: 50000,
          referral_required: true
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'TIER_BONUS_009',
        name: 'Loyalty Tier Bonus',
        description: 'Additional cashback for platinum tier customers',
        type: 'percentage',
        value: 3.0,
        min_purchase_amount: 30.0,
        max_cashback_amount: 75.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['platinum'],
        applicable_stores: ['all'],
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        is_active: true,
        priority: 9,
        conditions: {
          payment_methods: ['all'],
          min_quantity: 1,
          max_uses_per_user: null,
          max_uses_total: null
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'SEASONAL_PROM_010',
        name: 'Seasonal Promotion',
        description: 'Limited time seasonal cashback offer',
        type: 'percentage',
        value: 20.0,
        min_purchase_amount: 40.0,
        max_cashback_amount: 100.0,
        applicable_products: ['all'],
        applicable_user_tiers: ['all'],
        applicable_stores: ['all'],
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-08-31'),
        is_active: false,
        priority: 10,
        conditions: {
          payment_methods: ['all'],
          min_quantity: 1,
          max_uses_per_user: 1,
          max_uses_total: 1000
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('cashbackrules', cashbackRules, { clearFirst: false });
  }
}

module.exports = CashbackRuleSeeder;