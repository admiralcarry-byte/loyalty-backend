#!/usr/bin/env node

const SeederRunner = require('../seeders/SeederRunner');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const runner = new SeederRunner();

  try {
    switch (command) {
      case 'seed':
      case 'run':
        console.log('🌱 Running database seeding...\n');
        await runner.seed();
        break;

      case 'status':
        console.log('📊 Checking seeding status...\n');
        await runner.getSeedingStatus();
        break;

      case 'clear':
        console.log('🗑️  Clearing seeded data...\n');
        console.log('This will delete all seeded data from the database!');
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
          await runner.clearAll();
        } else {
          console.log('❌ Seeding clear cancelled');
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
    console.error('❌ Seeding command failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Database Seeding Tool for ÁGUA TWEZAH Admin System

Usage: npm run seed <command> [options]

Commands:
  seed, run       Run all seeders to populate database with sample data
  status          Show seeding status for all collections
  clear           Clear all seeded data from database
  help            Show this help message

Examples:
  npm run seed
  npm run seed:status
  npm run seed:clear

What gets seeded:
  - General Settings (company configuration)
  - Settings (system configuration)
  - Loyalty Levels (customer tiers)
  - Influencer Levels (influencer tiers)
  - Users (admin, managers, customers, influencers)
  - Stores (retail, wholesale, online, mobile locations)
  - Products (water bottles, subscriptions, services)
  - Campaigns (promotional, onboarding, referral campaigns)
  - Sales (customer and influencer transactions)
  - Points Transactions (earned, spent, bonus, referral points)
  - Commissions (influencer earnings)
  - Cashback Rules (discount rules)
  - Cashback Transactions (discount applications)
  - Purchase Entries (manual entries)
  - Online Purchases (e-commerce orders)
  - Online Purchase Items (order items)
  - Payout Requests (commission payouts)
  - Bank Details (user banking info)
  - Scan Uploads (receipt processing)
  - Billing Company Invoices (company billing)
  - Activity Logs (user activities)
  - Audit Logs (system changes)
  - Notifications (user notifications)
  - Refresh Tokens (session management)
  - AI Insights (analytics insights)

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