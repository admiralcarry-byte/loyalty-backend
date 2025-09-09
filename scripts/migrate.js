#!/usr/bin/env node

const MigrationRunner = require('../migrations/migrationRunner');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        console.log('🚀 Running database migrations...\n');
        await runner.runMigrations();
        break;

      case 'status':
        console.log('📊 Checking migration status...\n');
        await runner.getMigrationStatus();
        break;

      case 'rollback':
        const migrationName = args[1];
        if (!migrationName) {
          console.error('❌ Please specify a migration name to rollback');
          console.log('Usage: npm run migrate:rollback <migration-name>');
          process.exit(1);
        }
        console.log(`🔄 Rolling back migration: ${migrationName}\n`);
        await runner.rollbackMigration(migrationName);
        break;

      case 'reset':
        console.log('⚠️  Resetting database...\n');
        console.log('This will delete ALL data from the database!');
        console.log('Type "yes" to confirm, or press Ctrl+C to cancel.');
        
        // Wait for user confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise((resolve) => {
          rl.question('Are you sure? (yes/no): ', resolve);
        });
        
        rl.close();

        if (answer.toLowerCase() === 'yes') {
          await runner.resetDatabase();
        } else {
          console.log('❌ Database reset cancelled');
        }
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration command failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Database Migration Tool for ÁGUA TWEZAH Admin System

Usage: npm run migrate <command> [options]

Commands:
  up, migrate     Run all pending migrations
  status          Show migration status
  rollback <name> Rollback a specific migration
  reset           Reset database (delete all data)
  help            Show this help message

Examples:
  npm run migrate up
  npm run migrate status
  npm run migrate rollback 001_initial_schema.js
  npm run migrate reset

Environment Variables:
  MONGODB_URI     MongoDB connection string (default: mongodb://localhost:27017/aguatwezah_admin)
`);
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

// Run the main function
main();