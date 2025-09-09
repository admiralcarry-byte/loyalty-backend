const BaseSeeder = require('./BaseSeeder');

/**
 * Influencer Level seeder - Creates sample influencer levels
 */
class InfluencerLevelSeeder extends BaseSeeder {
  async seed() {
    console.log('🌟 Seeding influencer levels...');
    
    const existingCount = await this.getExistingCount('influencerlevels');
    if (existingCount > 0) {
      console.log(`ℹ️  Influencer levels collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const influencerLevels = [
      {
        name: 'Starter',
        tier: 1,
        description: 'New influencer level with basic benefits',
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
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Rising',
        tier: 2,
        description: 'Growing influencer with enhanced benefits',
        min_followers: 1000,
        max_followers: 4999,
        min_referrals: 5,
        max_referrals: 14,
        commission_rate: 7.5,
        benefits: {
          commission_multiplier: 1.2,
          bonus_commission: 2.5,
          exclusive_products: true,
          priority_support: false,
          marketing_materials: true,
          referral_bonus: 15
        },
        requirements: {
          min_social_followers: 1000,
          min_monthly_referrals: 3,
          content_quality: 'good'
        },
        color: '#3B82F6',
        icon: 'star',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Popular',
        tier: 3,
        description: 'Popular influencer with premium benefits',
        min_followers: 5000,
        max_followers: 19999,
        min_referrals: 15,
        max_referrals: 49,
        commission_rate: 10.0,
        benefits: {
          commission_multiplier: 1.5,
          bonus_commission: 5.0,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 25,
          custom_campaigns: true
        },
        requirements: {
          min_social_followers: 5000,
          min_monthly_referrals: 8,
          content_quality: 'excellent'
        },
        color: '#F59E0B',
        icon: 'star',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Elite',
        tier: 4,
        description: 'Elite influencer with maximum benefits',
        min_followers: 20000,
        max_followers: 99999,
        min_referrals: 50,
        max_referrals: 199,
        commission_rate: 12.5,
        benefits: {
          commission_multiplier: 2.0,
          bonus_commission: 7.5,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 50,
          custom_campaigns: true,
          personal_manager: true,
          event_invitations: true
        },
        requirements: {
          min_social_followers: 20000,
          min_monthly_referrals: 15,
          content_quality: 'excellent',
          engagement_rate: 0.05
        },
        color: '#8B5CF6',
        icon: 'crown',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Celebrity',
        tier: 5,
        description: 'Celebrity influencer with exclusive benefits',
        min_followers: 100000,
        max_followers: 999999,
        min_referrals: 200,
        max_referrals: 999,
        commission_rate: 15.0,
        benefits: {
          commission_multiplier: 2.5,
          bonus_commission: 10.0,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 100,
          custom_campaigns: true,
          personal_manager: true,
          event_invitations: true,
          brand_ambassador: true,
          custom_products: true
        },
        requirements: {
          min_social_followers: 100000,
          min_monthly_referrals: 25,
          content_quality: 'excellent',
          engagement_rate: 0.03,
          brand_alignment: true
        },
        color: '#10B981',
        icon: 'diamond',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Micro',
        tier: 0,
        description: 'Micro influencer with niche audience',
        min_followers: 0,
        max_followers: 999,
        min_referrals: 0,
        max_referrals: 4,
        commission_rate: 3.0,
        benefits: {
          commission_multiplier: 0.8,
          bonus_commission: 0,
          exclusive_products: false,
          priority_support: false,
          marketing_materials: false,
          referral_bonus: 5
        },
        requirements: {
          min_social_followers: 50,
          min_monthly_referrals: 1,
          content_quality: 'basic',
          niche_focus: true
        },
        color: '#9CA3AF',
        icon: 'circle',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Nano',
        tier: 6,
        description: 'Nano influencer with high engagement',
        min_followers: 1000,
        max_followers: 9999,
        min_referrals: 5,
        max_referrals: 19,
        commission_rate: 8.0,
        benefits: {
          commission_multiplier: 1.3,
          bonus_commission: 3.0,
          exclusive_products: true,
          priority_support: false,
          marketing_materials: true,
          referral_bonus: 20,
          high_engagement_bonus: true
        },
        requirements: {
          min_social_followers: 1000,
          min_monthly_referrals: 5,
          content_quality: 'good',
          engagement_rate: 0.08
        },
        color: '#EF4444',
        icon: 'heart',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Mega',
        tier: 7,
        description: 'Mega influencer with massive reach',
        min_followers: 1000000,
        max_followers: 9999999,
        min_referrals: 1000,
        max_referrals: 9999,
        commission_rate: 20.0,
        benefits: {
          commission_multiplier: 3.0,
          bonus_commission: 15.0,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 500,
          custom_campaigns: true,
          personal_manager: true,
          event_invitations: true,
          brand_ambassador: true,
          custom_products: true,
          global_campaigns: true
        },
        requirements: {
          min_social_followers: 1000000,
          min_monthly_referrals: 50,
          content_quality: 'excellent',
          engagement_rate: 0.02,
          brand_alignment: true,
          global_reach: true
        },
        color: '#F97316',
        icon: 'globe',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Local',
        tier: 8,
        description: 'Local influencer with community focus',
        min_followers: 500,
        max_followers: 4999,
        min_referrals: 3,
        max_referrals: 14,
        commission_rate: 6.0,
        benefits: {
          commission_multiplier: 1.1,
          bonus_commission: 1.0,
          exclusive_products: false,
          priority_support: false,
          marketing_materials: true,
          referral_bonus: 12,
          local_events: true,
          community_focus: true
        },
        requirements: {
          min_social_followers: 500,
          min_monthly_referrals: 2,
          content_quality: 'good',
          local_presence: true,
          community_engagement: true
        },
        color: '#84CC16',
        icon: 'map-pin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Corporate',
        tier: 9,
        description: 'Corporate influencer with business focus',
        min_followers: 10000,
        max_followers: 99999,
        min_referrals: 20,
        max_referrals: 99,
        commission_rate: 11.0,
        benefits: {
          commission_multiplier: 1.8,
          bonus_commission: 6.0,
          exclusive_products: true,
          priority_support: true,
          marketing_materials: true,
          referral_bonus: 30,
          custom_campaigns: true,
          business_networking: true,
          corporate_events: true
        },
        requirements: {
          min_social_followers: 10000,
          min_monthly_referrals: 10,
          content_quality: 'excellent',
          business_focus: true,
          professional_network: true
        },
        color: '#1F2937',
        icon: 'building',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('influencerlevels', influencerLevels, { clearFirst: false });
  }
}

module.exports = InfluencerLevelSeeder;