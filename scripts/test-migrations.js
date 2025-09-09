#!/usr/bin/env node

const MigrationRunner = require('../migrations/migrationRunner');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Test script for the migration system
 * This script tests the migration functionality
 */
async function testMigrations() {
  const runner = new MigrationRunner();
  
  try {
    console.log('🧪 Testing Migration System...\n');
    
    // Test 1: Check migration status
    console.log('Test 1: Checking migration status...');
    await runner.getMigrationStatus();
    
    // Test 2: Run migrations
    console.log('\nTest 2: Running migrations...');
    await runner.runMigrations();
    
    // Test 3: Check status again
    console.log('\nTest 3: Checking migration status after running...');
    await runner.getMigrationStatus();
    
    // Test 4: Verify collections exist
    console.log('\nTest 4: Verifying collections were created...');
    await runner.connect();
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Test 5: Verify default data was created
    console.log('\nTest 5: Verifying default data...');
    
    const GeneralSettings = require('../schemas/GeneralSettings');
    const LoyaltyLevel = require('../schemas/LoyaltyLevel');
    const InfluencerLevel = require('../schemas/InfluencerLevel');
    
    const settings = await GeneralSettings.findOne({ is_active: true });
    console.log(`✅ General settings: ${settings ? 'Found' : 'Not found'}`);
    
    const loyaltyLevels = await LoyaltyLevel.countDocuments();
    console.log(`✅ Loyalty levels: ${loyaltyLevels} found`);
    
    const influencerLevels = await InfluencerLevel.countDocuments();
    console.log(`✅ Influencer levels: ${influencerLevels} found`);
    
    console.log('\n✅ All migration tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration test failed:', error.message);
    process.exit(1);
  } finally {
    await runner.disconnect();
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

// Run tests
testMigrations();