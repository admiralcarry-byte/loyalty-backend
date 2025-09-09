const BaseSeeder = require('./BaseSeeder');

/**
 * Loyalty Level seeder - Creates sample loyalty levels
 */
class LoyaltyLevelSeeder extends BaseSeeder {
  async seed() {
    console.log('🏆 Seeding loyalty levels...');
    
    const existingCount = await this.getExistingCount('loyaltylevels');
    if (existingCount > 0) {
      console.log(`ℹ️  Loyalty levels collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const loyaltyLevels = [
      {
        name: 'Lead',
        tier: 1,
        description: 'New customer level with basic benefits',
        min_points: 0,
        max_points: 999,
        benefits: {
          points_multiplier: 1.0,
          discount_percentage: 0,
          free_delivery: false,
          priority_support: false,
          exclusive_products: false,
          birthday_bonus: 50
        },
        requirements: {
          min_purchases: 0,
          min_spend: 0,
          referral_count: 0
        },
        color: '#6B7280',
        icon: 'star',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Silver',
        tier: 2,
        description: 'Regular customer with enhanced benefits',
        min_points: 1000,
        max_points: 4999,
        benefits: {
          points_multiplier: 1.2,
          discount_percentage: 5,
          free_delivery: false,
          priority_support: false,
          exclusive_products: false,
          birthday_bonus: 100
        },
        requirements: {
          min_purchases: 5,
          min_spend: 100,
          referral_count: 0
        },
        color: '#9CA3AF',
        icon: 'star',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Gold',
        tier: 3,
        description: 'Valued customer with premium benefits',
        min_points: 5000,
        max_points: 14999,
        benefits: {
          points_multiplier: 1.5,
          discount_percentage: 10,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 200
        },
        requirements: {
          min_purchases: 15,
          min_spend: 500,
          referral_count: 2
        },
        color: '#F59E0B',
        icon: 'star',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Platinum',
        tier: 4,
        description: 'VIP customer with exclusive benefits',
        min_points: 15000,
        max_points: 999999,
        benefits: {
          points_multiplier: 2.0,
          discount_percentage: 15,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 500,
          personal_manager: true,
          early_access: true
        },
        requirements: {
          min_purchases: 30,
          min_spend: 1000,
          referral_count: 5
        },
        color: '#8B5CF6',
        icon: 'crown',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Diamond',
        tier: 5,
        description: 'Ultimate VIP customer with maximum benefits',
        min_points: 50000,
        max_points: 999999,
        benefits: {
          points_multiplier: 2.5,
          discount_percentage: 20,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 1000,
          personal_manager: true,
          early_access: true,
          custom_products: true,
          event_invitations: true
        },
        requirements: {
          min_purchases: 50,
          min_spend: 2500,
          referral_count: 10
        },
        color: '#10B981',
        icon: 'diamond',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Bronze',
        tier: 0,
        description: 'Inactive customer level',
        min_points: 0,
        max_points: 0,
        benefits: {
          points_multiplier: 0.5,
          discount_percentage: 0,
          free_delivery: false,
          priority_support: false,
          exclusive_products: false,
          birthday_bonus: 0
        },
        requirements: {
          min_purchases: 0,
          min_spend: 0,
          referral_count: 0
        },
        color: '#CD7F32',
        icon: 'circle',
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Corporate',
        tier: 6,
        description: 'Business customer level with special rates',
        min_points: 0,
        max_points: 999999,
        benefits: {
          points_multiplier: 1.8,
          discount_percentage: 12,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 0,
          bulk_discounts: true,
          custom_billing: true
        },
        requirements: {
          min_purchases: 100,
          min_spend: 5000,
          referral_count: 0,
          business_verification: true
        },
        color: '#1F2937',
        icon: 'building',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Student',
        tier: 7,
        description: 'Student discount level',
        min_points: 0,
        max_points: 999999,
        benefits: {
          points_multiplier: 1.3,
          discount_percentage: 8,
          free_delivery: false,
          priority_support: false,
          exclusive_products: false,
          birthday_bonus: 75,
          student_discount: true
        },
        requirements: {
          min_purchases: 0,
          min_spend: 0,
          referral_count: 0,
          student_verification: true
        },
        color: '#3B82F6',
        icon: 'graduation-cap',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Senior',
        tier: 8,
        description: 'Senior citizen discount level',
        min_points: 0,
        max_points: 999999,
        benefits: {
          points_multiplier: 1.4,
          discount_percentage: 10,
          free_delivery: true,
          priority_support: true,
          exclusive_products: false,
          birthday_bonus: 150,
          senior_discount: true
        },
        requirements: {
          min_purchases: 0,
          min_spend: 0,
          referral_count: 0,
          age_verification: 65
        },
        color: '#EF4444',
        icon: 'heart',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Family',
        tier: 9,
        description: 'Family plan with shared benefits',
        min_points: 0,
        max_points: 999999,
        benefits: {
          points_multiplier: 1.6,
          discount_percentage: 12,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 300,
          family_sharing: true,
          child_discounts: true
        },
        requirements: {
          min_purchases: 20,
          min_spend: 300,
          referral_count: 1,
          family_size: 3
        },
        color: '#F97316',
        icon: 'users',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('loyaltylevels', loyaltyLevels, { clearFirst: false });
  }
}

module.exports = LoyaltyLevelSeeder;