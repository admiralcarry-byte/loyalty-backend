const BaseSeeder = require('./BaseSeeder');
const UserSeeder = require('./UserSeeder');
const StoreSeeder = require('./StoreSeeder');
const SaleSeeder = require('./SaleSeeder');
const LoyaltyLevelSeeder = require('./LoyaltyLevelSeeder');
const InfluencerLevelSeeder = require('./InfluencerLevelSeeder');

/**
 * Seeder Runner - Manages and executes all seeders
 */
class SeederRunner extends BaseSeeder {
  constructor(activeMode = true) {
    super();
    this.activeMode = activeMode;
    
    if (activeMode) {
      // Only collections needed for currently active pages (10 records each)
      this.seeders = [
        // Core system levels
        LoyaltyLevelSeeder,    // 4 levels (Lead, Silver, Gold, Platinum)
        InfluencerLevelSeeder, // 3 levels (Silver, Gold, Platinum)
        
        // Main entities
        UserSeeder,            // 10 users (admin, managers, customers, influencers)
        StoreSeeder,           // 10 stores (retail locations)
        
        // Transactions
        SaleSeeder             // 10 sales transactions
      ];
    }
  }

  async seed() {
    console.log('🌱 Starting database seeding process...\n');
    
    try {
      await this.connect();
      await this.runSeeders();
    } catch (error) {
      console.error('\n❌ Database seeding failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async runSeeders() {
    try {
      // Run seeders in order
      for (const SeederClass of this.seeders) {
        const seeder = new SeederClass();
        await seeder.run();
      }
      
      console.log('\n✅ Database seeding completed successfully!');
      console.log('\n📊 Seeded collections:');
      
      if (this.activeMode) {
        console.log('   - Loyalty Levels (4 customer tiers: Lead, Silver, Gold, Platinum)');
        console.log('   - Influencer Levels (3 influencer tiers: Silver, Gold, Platinum)');
        console.log('   - Users (10 users: admin, managers, customers, influencers)');
        console.log('   - Stores (10 retail locations across Angola)');
        console.log('   - Sales (10 sales transactions)');
        console.log('\n💡 Active pages seeding mode - 5 collections for currently active pages');
        console.log('   Only tables needed for: Dashboard, User Management, Store Management,');
        console.log('   Sales Management, Loyalty Levels, and Influencer Levels.');
        console.log('   Each collection contains exactly 10 sample records (except levels).');
      }
    } catch (error) {
      console.error('\n❌ Seeding process failed:', error.message);
      throw error;
    }
  }

  async clearAll() {
    console.log('🗑️  Clearing all seeded data...\n');
    
    try {
      await this.connect();
      
      if (this.activeMode) {
        // Only clear collections for active pages
        const collections = [
          'sales',
          'stores',
          'users',
          'influencerlevels',
          'loyaltylevels'
        ];
        console.log('   Clearing only collections for active pages...');
        
        for (const collectionName of collections) {
          await this.clearCollection(collectionName);
        }
      }
      
      console.log('\n✅ All seeded data cleared successfully!');
      
    } catch (error) {
      console.error('\n❌ Error clearing seeded data:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async getSeedingStatus() {
    console.log('📊 Database Seeding Status\n');
    
    try {
      await this.connect();
      
      if (this.activeMode) {
        const collections = [
          { name: 'loyaltylevels', description: 'Customer loyalty tiers' },
          { name: 'influencerlevels', description: 'Influencer tiers' },
          { name: 'users', description: 'User accounts' },
          { name: 'stores', description: 'Store locations' },
          { name: 'sales', description: 'Sales transactions' }
        ];

        for (const collection of collections) {
          const count = await this.getExistingCount(collection.name);
          const status = count > 0 ? '✅ Seeded' : '⏳ Empty';
          console.log(`${status} - ${collection.name}: ${count} records (${collection.description})`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting seeding status:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = SeederRunner;