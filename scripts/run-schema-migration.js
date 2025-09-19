#!/usr/bin/env node

/**
 * Schema Migration Runner
 * Runs the database schema migrations to align with the corrected API structure
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Database Schema Migration...\n');

try {
  // Change to the backend directory
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📁 Changed to backend directory');
  console.log('🔧 Running migration runner...\n');
  
  // Run the migration runner
  execSync('node migrations/migrationRunner.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Database schema migration completed successfully!');
  console.log('📊 Database is now aligned with the corrected API structure');
  
} catch (error) {
  console.error('\n❌ Schema migration failed:', error.message);
  process.exit(1);
}