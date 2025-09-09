# Database Migration System

This directory contains the database migration system for the ÁGUA TWEZAH Admin Backend.

## Overview

The migration system allows you to:
- Set up the initial database schema
- Add new fields to existing collections
- Create new collections
- Modify indexes
- Seed initial data
- Rollback changes when needed

## Available Commands

### Initialize Database
```bash
npm run init-db
```
This command completely deletes all data from the database and sets up a fresh schema with default data. Use this for development or when you need to start fresh.

### Run Migrations
```bash
npm run migrate
```
Runs all pending migrations in order.

### Check Migration Status
```bash
npm run migrate:status
```
Shows which migrations have been executed and which are pending.

### Rollback Migration
```bash
npm run migrate:rollback <migration-name>
```
Rolls back a specific migration. Example:
```bash
npm run migrate:rollback 002_add_user_preferences.js
```

### Reset Database
```bash
npm run migrate:reset
```
⚠️ **WARNING**: This will delete ALL data from the database!

## Migration Files

Migration files should be named with a sequential number prefix and descriptive name:
- `001_initial_schema.js` - Sets up all collections and indexes
- `002_add_user_preferences.js` - Example migration adding new fields

## Creating New Migrations

1. Create a new file in the `migrations/` directory
2. Use the next sequential number (e.g., `003_`)
3. Follow this structure:

```javascript
const mongoose = require('mongoose');

module.exports = {
  async up() {
    // Migration logic here
    console.log('Running migration...');
    
    // Example: Add new field to existing collection
    const User = require('../schemas/User');
    await User.updateMany(
      { newField: { $exists: false } },
      { $set: { newField: 'defaultValue' } }
    );
    
    console.log('✅ Migration completed');
  },

  async down() {
    // Rollback logic here
    console.log('Rolling back migration...');
    
    // Example: Remove the field
    const User = require('../schemas/User');
    await User.updateMany(
      { newField: { $exists: true } },
      { $unset: { newField: 1 } }
    );
    
    console.log('✅ Migration rolled back');
  }
};
```

## Migration Best Practices

1. **Always test migrations** on a copy of production data first
2. **Make migrations reversible** - always implement the `down()` function
3. **Use descriptive names** for migration files
4. **Add logging** to track progress
5. **Handle errors gracefully** - migrations should fail fast if something goes wrong
6. **Don't modify existing migration files** once they've been run in production
7. **Use transactions** for complex migrations when possible

## Database Schema

The initial migration creates the following collections:

- `users` - User accounts and profiles
- `stores` - Store locations and information
- `sales` - Sales transactions
- `products` - Product catalog
- `campaigns` - Marketing campaigns
- `commissions` - Commission tracking
- `loyalty_levels` - Customer loyalty tiers
- `points_transactions` - Points earning/spending history
- `notifications` - System notifications
- `audit_logs` - System audit trail
- `cashback_rules` - Cashback configuration
- `cashback_transactions` - Cashback transactions
- `purchase_entries` - Purchase records
- `settings` - System settings
- `refresh_tokens` - Authentication tokens
- `online_purchases` - Online purchase records
- `online_purchase_items` - Online purchase line items
- `scan_uploads` - Receipt scan uploads
- `billing_company_invoices` - Billing invoices
- `bank_details` - Bank account information
- `influencer_levels` - Influencer program tiers
- `ai_insights` - AI-generated insights
- `payout_requests` - Payout requests
- `activity_logs` - User activity logs
- `general_settings` - General application settings
- `commission_rules` - Commission calculation rules
- `commission_settings` - Commission configuration

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/aguatwezah_admin`)

## Troubleshooting

### Migration Fails
1. Check the error message in the console
2. Verify your MongoDB connection
3. Ensure you have the necessary permissions
4. Check if the migration file syntax is correct

### Rollback Issues
1. Make sure the migration file exists
2. Verify the `down()` function is implemented
3. Check that the rollback logic is correct

### Database Connection Issues
1. Verify MongoDB is running
2. Check the `MONGODB_URI` environment variable
3. Ensure network connectivity to the database