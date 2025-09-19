#!/usr/bin/env node

/**
 * Schema Migration Rollback
 * Rolls back the database schema migrations
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Starting Database Schema Migration Rollback...\n');

try {
  // Change to the backend directory
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📁 Changed to backend directory');
  console.log('🔧 Running migration rollback...\n');
  
  // Run the migration rollback
  execSync('node migrations/migrationRunner.js rollback', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Database schema migration rollback completed successfully!');
  console.log('📊 Database has been rolled back to previous state');
  
} catch (error) {
  console.error('\n❌ Schema migration rollback failed:', error.message);
  process.exit(1);
}