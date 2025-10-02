const mongoose = require('mongoose');
const path = require('path');

// Import only the seeders we need (minimal set for active pages)
const UserSeeder = require('../seeders/UserSeeder');
const StoreSeeder = require('../seeders/StoreSeeder');
const LoyaltyLevelSeeder = require('../seeders/LoyaltyLevelSeeder');
const InfluencerLevelSeeder = require('../seeders/InfluencerLevelSeeder');
const TierRequirementSeeder = require('../seeders/TierRequirementSeeder');
const CommissionSettingsSeeder = require('../seeders/CommissionSettingsSeeder');
const GeneralSettingsSeeder = require('../seeders/GeneralSettingsSeeder');
const SaleSeeder = require('../seeders/SaleSeeder');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';

// Ensure we're using the correct database name for production
const getDatabaseUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  // For local development, use aguatwezah_admin
  return 'mongodb://localhost:27017/aguatwezah_admin';
};

async function runSeeders() {
  try {
    const databaseUri = getDatabaseUri();
    console.log('🚀 Starting database seeding...');
    console.log(`📡 Connecting to MongoDB: ${databaseUri}`);

    // Configure mongoose to prevent auto-creation
    mongoose.set('autoCreate', false);
    mongoose.set('autoIndex', false);
    
    // Connect to MongoDB
    await mongoose.connect(databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Define seeder order (dependencies matter) - only essential collections for active pages
    const seeders = [
      new GeneralSettingsSeeder(),
      new LoyaltyLevelSeeder(),
      new InfluencerLevelSeeder(),
      new TierRequirementSeeder(),
      new UserSeeder(),
      new CommissionSettingsSeeder(),
      new StoreSeeder(),
      new SaleSeeder()
    ];

    // Run seeders in sequence
    for (const seeder of seeders) {
      console.log(`\n🌱 Running ${seeder.constructor.name} seeder...`);
      await seeder.run();
      console.log(`✅ ${seeder.constructor.name} seeder completed`);
    }

    console.log('\n🎉 All seeders completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('- 1 General Settings (Platform configuration)');
    console.log('- 4 Loyalty Levels (Lead, Silver, Gold, Platinum)');
    console.log('- 3 Influencer Levels (Silver, Gold, Platinum)');
    console.log('- 4 Tier Requirements (Auto tier progression: Lead→Silver→Gold→Platinum)');
    console.log('- 10 Users (admin, managers, customers, influencers)');
    console.log('- 1 Commission Settings (Commission rates and configuration)');
    console.log('- 10 Stores (retail locations)');
    console.log('- 10 Sales transactions');
    console.log('\n🔑 Admin login credentials:');
    console.log('   Email: admin@aguatwezah.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Seeding interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Seeding terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the seeders
runSeeders();