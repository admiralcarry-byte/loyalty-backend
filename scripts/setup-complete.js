#!/usr/bin/env node

const MigrationRunner = require('../migrations/migrationRunner');
const SeederRunner = require('../seeders/SeederRunner');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Complete database setup script
 * This script runs migrations and seeds the database with sample data
 */
async function setupComplete() {
  console.log('🚀 Complete Database Setup for ÁGUA TWEZAH Admin System\n');
  
  try {
    // Step 1: Run migrations
    console.log('📋 Step 1: Running database migrations...');
    const migrationRunner = new MigrationRunner();
    await migrationRunner.runMigrations();
    
    // Step 2: Seed the database
    console.log('\n📋 Step 2: Seeding database with sample data...');
    const seederRunner = new SeederRunner();
    await seederRunner.seed();
    
    // Step 3: Show final status
    console.log('\n📋 Step 3: Final database status...');
    await migrationRunner.getMigrationStatus();
    console.log('');
    await seederRunner.getSeedingStatus();
    
    console.log('\n🎉 Complete database setup finished successfully!');
    console.log('\n📊 Your database now contains:');
    console.log('   ✅ All collections and indexes created');
    console.log('   ✅ Default settings and loyalty levels');
    console.log('   ✅ Sample users (admin, managers, customers, influencers)');
    console.log('   ✅ Sample stores (retail, wholesale, online)');
    console.log('   ✅ Sample products (water bottles, subscriptions)');
    console.log('   ✅ Sample campaigns (promotional, referral, onboarding)');
    console.log('   ✅ Sample sales transactions');
    console.log('   ✅ Sample points transactions');
    
    console.log('\n🔑 Default login credentials:');
    console.log('   Admin: admin@aguatwezah.com / admin123');
    console.log('   Manager: manager@aguatwezah.com / manager123');
    console.log('   Customer: customer@example.com / customer123');
    console.log('   Influencer: influencer@example.com / influencer123');
    console.log('   Staff: staff@aguatwezah.com / staff123');
    
    console.log('\n🚀 You can now start your application with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Complete setup failed:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

// Run setup
setupComplete();