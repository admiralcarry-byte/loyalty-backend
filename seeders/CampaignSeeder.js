const BaseSeeder = require('./BaseSeeder');

/**
 * Campaign seeder - Creates sample marketing campaigns
 */
class CampaignSeeder extends BaseSeeder {
  async seed() {
    console.log('📢 Seeding campaigns...');
    
    const existingCount = await this.getExistingCount('campaigns');
    if (existingCount > 0) {
      console.log(`ℹ️  Campaigns collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get admin user for created_by field
    const mongoose = require('mongoose');
    const adminUser = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : null;

    const campaigns = [
      {
        name: 'Summer Hydration Campaign',
        description: 'Stay hydrated this summer with special offers on all water products',
        code: 'SUMMER2024',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-03-31'),
        rules: {
          minimum_purchase: 20,
          maximum_discount: 50,
          points_multiplier: 1.5,
          discount_percentage: 15,
          applicable_user_tiers: ['lead', 'silver', 'gold', 'platinum']
        },
        targeting: {
          user_segments: ['returning_users', 'high_value_users'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 5000,
          spent_amount: 1250
        },
        performance: {
          total_enrollments: 500,
          total_redemptions: 175,
          total_revenue_generated: 8750
        },
        channels: ['email', 'sms', 'push_notification', 'social_media'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/summer-hydration-banner.jpg',
            alt_text: 'Summer Hydration Campaign Banner'
          }
        },
        tracking: {
          utm_source: 'email',
          utm_medium: 'campaign',
          utm_campaign: 'summer_hydration'
        },
        created_by: createdBy
      },
      {
        name: 'New Customer Welcome',
        description: 'Welcome new customers with a special first purchase discount',
        code: 'WELCOME20',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rules: {
          minimum_purchase: 10,
          maximum_discount: 25,
          points_multiplier: 2.0,
          discount_percentage: 20,
          applicable_user_tiers: ['lead']
        },
        targeting: {
          user_segments: ['new_users'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 2000,
          spent_amount: 450
        },
        performance: {
          total_enrollments: 200,
          total_redemptions: 45,
          total_revenue_generated: 2250
        },
        channels: ['email', 'push_notification'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/welcome-banner.jpg',
            alt_text: 'Welcome Campaign Banner'
          }
        },
        tracking: {
          utm_source: 'email',
          utm_medium: 'onboarding',
          utm_campaign: 'welcome'
        },
        created_by: createdBy
      },
      {
        name: 'Premium Water Launch',
        description: 'Introducing our new premium water line with enhanced minerals',
        code: 'PREMIUM5',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-04-30'),
        rules: {
          minimum_purchase: 30,
          maximum_discount: 5,
          points_multiplier: 2.0,
          discount_percentage: 0,
          applicable_user_tiers: ['gold', 'platinum']
        },
        targeting: {
          user_segments: ['high_value_users'],
          geographic_regions: ['Luanda', 'Benguela']
        },
        budget: {
          total_budget: 3000,
          spent_amount: 750
        },
        performance: {
          total_enrollments: 100,
          total_redemptions: 25,
          total_revenue_generated: 3750
        },
        channels: ['email', 'social_media', 'website'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/premium-launch-banner.jpg',
            alt_text: 'Premium Water Launch Banner'
          }
        },
        tracking: {
          utm_source: 'social',
          utm_medium: 'campaign',
          utm_campaign: 'premium_launch'
        },
        created_by: createdBy
      },
      {
        name: 'Referral Program Boost',
        description: 'Earn extra rewards for referring friends and family',
        code: 'REFER15',
        type: 'referral_bonus',
        status: 'active',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-06-15'),
        rules: {
          minimum_purchase: 0,
          maximum_discount: 0,
          points_multiplier: 1.0,
          referral_bonus: 15,
          applicable_user_tiers: ['silver', 'gold', 'platinum']
        },
        targeting: {
          user_segments: ['returning_users', 'high_value_users'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 1000,
          spent_amount: 200
        },
        performance: {
          total_enrollments: 50,
          total_redemptions: 10,
          total_revenue_generated: 1000
        },
        channels: ['email', 'sms', 'push_notification'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/referral-banner.jpg',
            alt_text: 'Referral Program Banner'
          }
        },
        tracking: {
          utm_source: 'email',
          utm_medium: 'referral',
          utm_campaign: 'referral_boost'
        },
        created_by: createdBy
      },
      {
        name: 'Loyalty Tier Upgrade',
        description: 'Special offers for customers upgrading their loyalty tier',
        code: 'UPGRADE12',
        type: 'loyalty_tier',
        status: 'active',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-05-31'),
        rules: {
          minimum_purchase: 25,
          maximum_discount: 30,
          points_multiplier: 1.3,
          discount_percentage: 12,
          applicable_user_tiers: ['lead', 'silver']
        },
        targeting: {
          user_segments: ['returning_users'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 1500,
          spent_amount: 300
        },
        performance: {
          total_enrollments: 75,
          total_redemptions: 15,
          total_revenue_generated: 1500
        },
        channels: ['email', 'push_notification'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/upgrade-banner.jpg',
            alt_text: 'Loyalty Tier Upgrade Banner'
          }
        },
        tracking: {
          utm_source: 'email',
          utm_medium: 'retention',
          utm_campaign: 'tier_upgrade'
        },
        created_by: createdBy
      },
      {
        name: 'Winter Wellness Campaign',
        description: 'Stay healthy during winter with our premium water products',
        code: 'WINTER2024',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-08-31'),
        rules: {
          minimum_purchase: 15,
          maximum_discount: 40,
          points_multiplier: 1.2,
          discount_percentage: 10,
          applicable_user_tiers: ['lead', 'silver', 'gold', 'platinum']
        },
        targeting: {
          user_segments: ['returning_users', 'health_conscious'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 3500,
          spent_amount: 875
        },
        performance: {
          total_enrollments: 300,
          total_redemptions: 90,
          total_revenue_generated: 4500
        },
        channels: ['email', 'push_notification', 'social_media'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/winter-wellness-banner.jpg',
            alt_text: 'Winter Wellness Campaign Banner'
          }
        },
        tracking: {
          utm_source: 'email',
          utm_medium: 'campaign',
          utm_campaign: 'winter_wellness'
        },
        created_by: createdBy
      },
      {
        name: 'Family Pack Special',
        description: 'Special discount on family-sized water bottles',
        code: 'FAMILY25',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-04-01'),
        end_date: new Date('2024-06-30'),
        rules: {
          minimum_purchase: 30,
          maximum_discount: 25,
          points_multiplier: 1.8,
          discount_percentage: 25,
          applicable_user_tiers: ['silver', 'gold', 'platinum']
        },
        targeting: {
          user_segments: ['family_users', 'bulk_buyers'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 2500,
          spent_amount: 625
        },
        performance: {
          total_enrollments: 150,
          total_redemptions: 45,
          total_revenue_generated: 3000
        },
        channels: ['email', 'sms', 'push_notification'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/family-pack-banner.jpg',
            alt_text: 'Family Pack Special Banner'
          }
        },
        tracking: {
          utm_source: 'email',
          utm_medium: 'campaign',
          utm_campaign: 'family_pack'
        },
        created_by: createdBy
      },
      {
        name: 'Student Discount Program',
        description: 'Special pricing for students and educational institutions',
        code: 'STUDENT10',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rules: {
          minimum_purchase: 5,
          maximum_discount: 20,
          points_multiplier: 1.5,
          discount_percentage: 10,
          applicable_user_tiers: ['lead', 'silver']
        },
        targeting: {
          user_segments: ['students', 'educational_institutions'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 1500,
          spent_amount: 300
        },
        performance: {
          total_enrollments: 100,
          total_redemptions: 25,
          total_revenue_generated: 1500
        },
        channels: ['email', 'social_media', 'website'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/student-discount-banner.jpg',
            alt_text: 'Student Discount Program Banner'
          }
        },
        tracking: {
          utm_source: 'social',
          utm_medium: 'campaign',
          utm_campaign: 'student_discount'
        },
        created_by: createdBy
      },
      {
        name: 'Corporate Wellness Program',
        description: 'Bulk discounts for corporate wellness programs',
        code: 'CORP20',
        type: 'discount',
        status: 'active',
        start_date: new Date('2024-02-15'),
        end_date: new Date('2024-12-15'),
        rules: {
          minimum_purchase: 100,
          maximum_discount: 50,
          points_multiplier: 2.0,
          discount_percentage: 20,
          applicable_user_tiers: ['platinum']
        },
        targeting: {
          user_segments: ['corporate_clients', 'bulk_buyers'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 5000,
          spent_amount: 1000
        },
        performance: {
          total_enrollments: 25,
          total_redemptions: 10,
          total_revenue_generated: 5000
        },
        channels: ['email', 'direct_sales', 'website'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/corporate-wellness-banner.jpg',
            alt_text: 'Corporate Wellness Program Banner'
          }
        },
        tracking: {
          utm_source: 'direct',
          utm_medium: 'campaign',
          utm_campaign: 'corporate_wellness'
        },
        created_by: createdBy
      },
      {
        name: 'Eco-Friendly Initiative',
        description: 'Rewards for customers who return bottles for recycling',
        code: 'ECO5',
        type: 'points_bonus',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rules: {
          minimum_purchase: 0,
          maximum_discount: 0,
          points_multiplier: 1.0,
          points_bonus: 5,
          applicable_user_tiers: ['lead', 'silver', 'gold', 'platinum']
        },
        targeting: {
          user_segments: ['eco_conscious', 'all_users'],
          geographic_regions: ['Luanda', 'Benguela', 'Huambo']
        },
        budget: {
          total_budget: 1000,
          spent_amount: 200
        },
        performance: {
          total_enrollments: 500,
          total_redemptions: 100,
          total_revenue_generated: 1000
        },
        channels: ['email', 'in_store', 'website'],
        creative: {
          banner_image: {
            url: 'https://aguatwezah.com/campaigns/eco-friendly-banner.jpg',
            alt_text: 'Eco-Friendly Initiative Banner'
          }
        },
        tracking: {
          utm_source: 'in_store',
          utm_medium: 'campaign',
          utm_campaign: 'eco_friendly'
        },
        created_by: createdBy
      }
    ];

    await this.seedCollection('campaigns', campaigns, { clearFirst: false });
  }
}

module.exports = CampaignSeeder;