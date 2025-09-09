# Database Seeding System

This directory contains the database seeding system for the ÁGUA TWEZAH Admin Backend.

## Overview

The seeding system populates your database with realistic sample data for development and testing purposes. It creates:

- **Users**: Admin, managers, customers, and influencers with different loyalty tiers
- **Stores**: Retail, wholesale, and online stores across different cities
- **Products**: Water bottles, subscriptions, and services
- **Campaigns**: Marketing campaigns for different purposes
- **Sales**: Customer and influencer transactions
- **Points Transactions**: Points earned, spent, bonus, and referral transactions

## Available Commands

### Seed Database
```bash
npm run seed
```
Populates the database with sample data for all collections.

### Check Seeding Status
```bash
npm run seed:status
```
Shows how many records are in each seeded collection.

### Clear Seeded Data
```bash
npm run seed:clear
```
⚠️ **WARNING**: This will delete all seeded data from the database!

### Complete Setup (Migration + Seeding)
```bash
npm run setup-complete
```
Runs migrations and seeds the database in one command.

## Seeded Data Details

### Users (5 records)
- **Admin User**: `admin@aguatwezah.com` / `admin123`
- **Manager**: `manager@aguatwezah.com` / `manager123`
- **Customer**: `customer@example.com` / `customer123`
- **Influencer**: `influencer@example.com` / `influencer123`
- **Staff**: `staff@aguatwezah.com` / `staff123`

### Stores (4 records)
- **Luanda Centro**: Retail store in city center
- **Benguela**: Coastal retail store
- **Huambo**: Wholesale store for businesses
- **Online Store**: Digital platform for nationwide delivery

### Products (7 records)
- **Premium 500ml**: $2.50 - Premium purified water
- **Standard 1L**: $4.00 - Standard purified water
- **Family 5L**: $15.00 - Family size bottle
- **Premium 1.5L**: $5.50 - Enhanced minerals
- **Sparkling 500ml**: $3.50 - Natural carbonation
- **Monthly Subscription**: $25.00 - Regular delivery service
- **Bottle Exchange**: $0.50 - Return empty bottles for credit

### Campaigns (5 records)
- **Summer Hydration**: 15% discount on all products
- **New Customer Welcome**: 20% discount for first purchase
- **Premium Water Launch**: $5 off premium products
- **Referral Program**: 15% cashback for referrals
- **Loyalty Tier Upgrade**: 12% discount for tier upgrades

### Sales (175+ records)
- **Customer Sales**: 150 transactions with realistic data
- **Influencer Sales**: 25 transactions with special discounts
- **Date Range**: Last 90 days of transactions
- **Payment Methods**: Cash, mobile money, bank transfer, credit card
- **Order Status**: Delivered, in transit, processing, cancelled

### Points Transactions (200+ records)
- **Earned Points**: From purchases and campaigns
- **Spent Points**: Redemptions for discounts
- **Bonus Points**: Loyalty program bonuses
- **Referral Points**: Points from referring friends
- **Expired Points**: Points that expired after 1 year

## Seeder Architecture

### BaseSeeder Class
All seeders extend the `BaseSeeder` class which provides:
- Database connection management
- Collection clearing and seeding methods
- Error handling and logging
- Connection status tracking

### Individual Seeders
- **UserSeeder**: Creates users with different roles and loyalty tiers
- **StoreSeeder**: Creates stores with locations and operating hours
- **ProductSeeder**: Creates products with pricing and inventory
- **CampaignSeeder**: Creates marketing campaigns
- **SaleSeeder**: Creates sales transactions with relationships
- **PointsTransactionSeeder**: Creates points transactions

### SeederRunner
Manages the execution of all seeders in the correct order and provides:
- Sequential execution of seeders
- Status reporting
- Data clearing functionality

## Customization

### Adding New Seeders
1. Create a new seeder file in the `seeders/` directory
2. Extend the `BaseSeeder` class
3. Implement the `seed()` method
4. Add the seeder to `SeederRunner.js`

Example:
```javascript
const BaseSeeder = require('./BaseSeeder');

class MySeeder extends BaseSeeder {
  async seed() {
    console.log('Seeding my data...');
    
    const data = [
      { name: 'Example', value: 123 }
    ];
    
    await this.seedCollection('my_collection', data);
  }
}

module.exports = MySeeder;
```

### Modifying Existing Data
Edit the respective seeder files to change:
- Number of records created
- Data values and relationships
- Business logic and calculations

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/aguatwezah_admin`)

## Best Practices

1. **Run migrations first** - Always run migrations before seeding
2. **Check existing data** - Seeders skip if data already exists
3. **Use realistic data** - Create data that reflects real-world scenarios
4. **Maintain relationships** - Ensure foreign key relationships are valid
5. **Handle errors gracefully** - Seeders should fail fast on errors
6. **Log progress** - Provide clear feedback during seeding process

## Troubleshooting

### Seeding Fails
1. Check MongoDB connection
2. Verify migrations have been run
3. Check for duplicate data conflicts
4. Review seeder error messages

### Missing Relationships
1. Ensure seeders run in correct order
2. Check that referenced collections exist
3. Verify foreign key values are valid

### Performance Issues
1. Reduce number of records in seeders
2. Use bulk insert operations
3. Check database indexes

## Development Workflow

1. **Initial Setup**:
   ```bash
   npm run setup-complete
   ```

2. **After Schema Changes**:
   ```bash
   npm run migrate
   npm run seed:clear
   npm run seed
   ```

3. **Testing**:
   ```bash
   npm run seed:status
   ```

4. **Clean Slate**:
   ```bash
   npm run init-db
   npm run setup-complete
   ```