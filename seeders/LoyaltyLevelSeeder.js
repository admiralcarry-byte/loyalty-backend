const BaseSeeder = require('./BaseSeeder');

/**
 * Loyalty Level seeder - Creates sample loyalty levels
 */
class LoyaltyLevelSeeder extends BaseSeeder {
  async seed() {
    console.log('🏆 Seeding loyalty levels...');
    
    const existingCount = await this.getExistingCount('loyaltylevels');
    if (existingCount > 0) {
      console.log(`ℹ️  Loyalty levels collection already has ${existingCount} records. Clearing first...`);
      await this.clearCollection('loyaltylevels');
    }

    const loyaltyLevels = [
      {
        name: 'Lead',
        code: 'LEAD',
        tier: 'lead',
        level_number: 1,
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
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Silver',
        code: 'SILVER',
        tier: 'silver',
        level_number: 2,
        description: 'Regular customer with enhanced benefits',
        min_points: 1000,
        max_points: 4999,
        benefits: {
          points_multiplier: 1.2,
          discount_percentage: 5,
          free_delivery: false,
          priority_support: true,
          exclusive_products: false,
          birthday_bonus: 100
        },
        requirements: {
          min_purchases: 10,
          min_spend: 500,
          referral_count: 0
        },
        color: '#9CA3AF',
        icon: 'medal',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gold',
        code: 'GOLD',
        tier: 'gold',
        level_number: 3,
        description: 'Loyal customer with premium benefits',
        min_points: 5000,
        max_points: 19999,
        benefits: {
          points_multiplier: 1.5,
          discount_percentage: 10,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 200
        },
        requirements: {
          min_purchases: 25,
          min_spend: 1500,
          referral_count: 2
        },
        color: '#F59E0B',
        icon: 'crown',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Platinum',
        code: 'PLATINUM',
        tier: 'platinum',
        level_number: 4,
        description: 'VIP customer with maximum benefits',
        min_points: 20000,
        max_points: 999999,
        benefits: {
          points_multiplier: 2.0,
          discount_percentage: 15,
          free_delivery: true,
          priority_support: true,
          exclusive_products: true,
          birthday_bonus: 500
        },
        requirements: {
          min_purchases: 50,
          min_spend: 3000,
          referral_count: 5
        },
        color: '#8B5CF6',
        icon: 'gem',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await this.seedCollection('loyaltylevels', loyaltyLevels, { clearFirst: false });
  }
}

module.exports = LoyaltyLevelSeeder;