const mongoose = require('mongoose');
const path = require('path');

// Import only the seeders we need (minimal set for active pages)
const UserSeeder = require('../seeders/UserSeeder');
const StoreSeeder = require('../seeders/StoreSeeder');
const LoyaltyLevelSeeder = require('../seeders/LoyaltyLevelSeeder');
const InfluencerLevelSeeder = require('../seeders/InfluencerLevelSeeder');
const SaleSeeder = require('../seeders/SaleSeeder');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';

async function runSeeders() {
  try {
    console.log('🚀 Starting database seeding...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);

    // Configure mongoose to prevent auto-creation
    mongoose.set('autoCreate', false);
    mongoose.set('autoIndex', false);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Define seeder order (dependencies matter) - only essential collections for active pages
    const seeders = [
      new LoyaltyLevelSeeder(),
      new InfluencerLevelSeeder(),
      new UserSeeder(),
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
    console.log('- 4 Loyalty Levels (Lead, Silver, Gold, Platinum)');
    console.log('- 3 Influencer Levels (Silver, Gold, Platinum)');
    console.log('- 10 Users (admin, managers, customers, influencers)');
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