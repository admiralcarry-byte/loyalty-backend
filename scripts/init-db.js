#!/usr/bin/env node

const MigrationRunner = require('../migrations/migrationRunner');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Database initialization script
 * This script completely deletes all data from the database and sets up fresh schema
 * Based on memory: "The project's init-db command should completely delete all data from the database, leaving all tables empty."
 */
async function initializeDatabase() {
  const runner = new MigrationRunner();
  
  try {
    console.log('🚀 Initializing ÁGUA TWEZAH Admin Database...\n');
    
    // Step 1: Connect to database
    console.log('📡 Connecting to MongoDB...');
    await runner.connect();
    
    // Step 2: Reset database (delete all data)
    console.log('\n🗑️  Resetting database (deleting all existing data)...');
    await runner.resetDatabase();
    
    // Step 3: Run migrations to set up schema
    console.log('\n🏗️  Setting up database schema...');
    await runner.runMigrations();
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('📊 Database is now ready with:');
    console.log('   - All collections created');
    console.log('   - All indexes established');
    console.log('   - Default settings configured');
    console.log('   - Default loyalty levels created');
    console.log('   - Default influencer levels created');
    console.log('   - All tables are empty and ready for use');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
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

// Run initialization
initializeDatabase();