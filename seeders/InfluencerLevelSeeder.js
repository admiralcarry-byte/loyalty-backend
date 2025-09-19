const BaseSeeder = require('./BaseSeeder');

/**
 * Influencer Level seeder - Creates sample influencer levels
 */
class InfluencerLevelSeeder extends BaseSeeder {
  async seed() {
    console.log('🌟 Seeding influencer levels...');
    
    const existingCount = await this.getExistingCount('influencerlevels');
    if (existingCount > 0) {
      console.log(`ℹ️  Influencer levels collection already has ${existingCount} records. Clearing first...`);
      await this.clearCollection('influencerlevels');
    }

    const influencerLevels = [
      {
        name: 'Silver',
        level_order: 1,
        description: 'New influencer level with basic benefits',
        required_referrals: 0,
        required_active_clients: 0,
        min_followers: 0,
        max_followers: 999,
        min_referrals: 0,
        max_referrals: 4,
        commission_rate: 5.0,
        benefits: {
          commission_multiplier: 1.0,
          bonus_commission: 0,
          exclusive_products: false,
          priority_support: false,
          marketing_materials: true,
          referral_bonus: 10
        },
        requirements: {
          min_social_followers: 100,
          min_monthly_referrals: 1,
          content_quality: 'basic'
        },
        color: '#6B7280',
        icon: 'star',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gold',
        level_order: 2,
        description: 'Growing influencer with enhanced benefits',
        required_referrals: 5,
        required_active_clients: 10,
        min_followers: 1000,
        max_followers: 4999,
        min_referrals: 5,
        max_referrals: 19,
        commission_rate: 7.5,
        benefits: {
          commission_multiplier: 1.5,
          bonus_commission: 50,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 25
        },
        requirements: {
          min_social_followers: 1000,
          min_monthly_referrals: 3,
          content_quality: 'good'
        },
        color: '#F59E0B',
        icon: 'medal',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Platinum',
        level_order: 3,
        description: 'Top influencer with maximum benefits',
        required_referrals: 20,
        required_active_clients: 50,
        min_followers: 5000,
        max_followers: 999999,
        min_referrals: 20,
        max_referrals: 999,
        commission_rate: 10.0,
        benefits: {
          commission_multiplier: 2.0,
          bonus_commission: 100,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 50,
          personal_manager: true,
          early_access: true
        },
        requirements: {
          min_social_followers: 5000,
          min_monthly_referrals: 10,
          content_quality: 'excellent'
        },
        color: '#8B5CF6',
        icon: 'crown',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await this.seedCollection('influencerlevels', influencerLevels, { clearFirst: false });
  }
}

module.exports = InfluencerLevelSeeder;