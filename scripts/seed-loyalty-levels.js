const mongoose = require('mongoose');
require('dotenv').config();

// Import LoyaltyLevel model
const LoyaltyLevel = require('../models/LoyaltyLevel');

async function seedLoyaltyLevels() {
  try {
    console.log('🌱 Seeding Loyalty Levels...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin_local';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const loyaltyLevelModel = new LoyaltyLevel();

    // Check if levels already exist
    const existingCount = await loyaltyLevelModel.model.countDocuments({});
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} loyalty level(s) already exist.`);
      console.log('Do you want to clear and re-seed? (This script will clear first)\n');
      
      // Clear existing levels
      await loyaltyLevelModel.model.deleteMany({});
      console.log('✅ Cleared existing loyalty levels\n');
    }

    // Define loyalty levels
    const loyaltyLevels = [
      {
        name: 'Lead',
        code: 'LEAD',
        tier: 'lead',
        level_number: 1,
        description: 'New customer level with basic benefits',
        status: 'active',
        requirements: {
          minimum_liters: 0,
          minimum_points: 0,
          minimum_purchases: 0,
          minimum_spend: 0,
          minimum_referrals: 0,
          time_requirement: 0
        },
        benefits: {
          points_multiplier: 1.0,
          discount_percentage: 0,
          cashback_rate: 2,
          free_delivery: false,
          priority_support: false,
          exclusive_offers: false,
          birthday_bonus: 50
        },
        color: '#6B7280',
        icon: 'star'
      },
      {
        name: 'Silver',
        code: 'SILVER',
        tier: 'silver',
        level_number: 2,
        description: 'Regular customer with enhanced benefits',
        status: 'active',
        requirements: {
          minimum_liters: 50,
          minimum_points: 1000,
          minimum_purchases: 10,
          minimum_spend: 500,
          minimum_referrals: 0,
          time_requirement: 0
        },
        benefits: {
          points_multiplier: 1.2,
          discount_percentage: 5,
          cashback_rate: 3,
          free_delivery: false,
          priority_support: true,
          exclusive_offers: false,
          birthday_bonus: 100
        },
        color: '#9CA3AF',
        icon: 'medal'
      },
      {
        name: 'Gold',
        code: 'GOLD',
        tier: 'gold',
        level_number: 3,
        description: 'Loyal customer with premium benefits',
        status: 'active',
        requirements: {
          minimum_liters: 150,
          minimum_points: 5000,
          minimum_purchases: 25,
          minimum_spend: 1500,
          minimum_referrals: 2,
          time_requirement: 0
        },
        benefits: {
          points_multiplier: 1.5,
          discount_percentage: 10,
          cashback_rate: 5,
          free_delivery: true,
          priority_support: true,
          exclusive_offers: true,
          birthday_bonus: 200
        },
        color: '#F59E0B',
        icon: 'crown'
      },
      {
        name: 'Platinum',
        code: 'PLATINUM',
        tier: 'platinum',
        level_number: 4,
        description: 'VIP customer with maximum benefits',
        status: 'active',
        requirements: {
          minimum_liters: 300,
          minimum_points: 20000,
          minimum_purchases: 50,
          minimum_spend: 3000,
          minimum_referrals: 5,
          time_requirement: 0
        },
        benefits: {
          points_multiplier: 2.0,
          discount_percentage: 15,
          cashback_rate: 7,
          free_delivery: true,
          priority_support: true,
          exclusive_offers: true,
          birthday_bonus: 500
        },
        color: '#8B5CF6',
        icon: 'gem'
      }
    ];

    console.log(`📝 Creating ${loyaltyLevels.length} loyalty levels...\n`);

    for (const levelData of loyaltyLevels) {
      const level = await loyaltyLevelModel.create(levelData);
      console.log(`✅ Created: ${level.name} (${level.tier}) - Level ${level.level_number}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Loyalty levels seeded successfully!');
    console.log('='.repeat(70));
    
    // Verify
    const finalCount = await loyaltyLevelModel.model.countDocuments({});
    console.log(`\n📊 Total loyalty levels in database: ${finalCount}`);

    await mongoose.connection.close();
    console.log('\n📡 Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedLoyaltyLevels()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
