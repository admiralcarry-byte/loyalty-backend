const BaseSeeder = require('./BaseSeeder');
const UserSeeder = require('./UserSeeder');
const StoreSeeder = require('./StoreSeeder');
const ProductSeeder = require('./ProductSeeder');
const CampaignSeeder = require('./CampaignSeeder');
const SaleSeeder = require('./SaleSeeder');
const PointsTransactionSeeder = require('./PointsTransactionSeeder');
const ActivityLogSeeder = require('./ActivityLogSeeder');
const AIInsightsSeeder = require('./AIInsightsSeeder');
const BankDetailsSeeder = require('./BankDetailsSeeder');
const CommissionSeeder = require('./CommissionSeeder');
const LoyaltyLevelSeeder = require('./LoyaltyLevelSeeder');
const NotificationSeeder = require('./NotificationSeeder');
const AuditLogSeeder = require('./AuditLogSeeder');
const CashbackRuleSeeder = require('./CashbackRuleSeeder');
const CashbackTransactionSeeder = require('./CashbackTransactionSeeder');
const PurchaseEntrySeeder = require('./PurchaseEntrySeeder');
const SettingSeeder = require('./SettingSeeder');
const RefreshTokenSeeder = require('./RefreshTokenSeeder');
const OnlinePurchaseSeeder = require('./OnlinePurchaseSeeder');
const OnlinePurchaseItemSeeder = require('./OnlinePurchaseItemSeeder');
const ScanUploadSeeder = require('./ScanUploadSeeder');
const BillingCompanyInvoiceSeeder = require('./BillingCompanyInvoiceSeeder');
const InfluencerLevelSeeder = require('./InfluencerLevelSeeder');
const PayoutRequestSeeder = require('./PayoutRequestSeeder');
const GeneralSettingsSeeder = require('./GeneralSettingsSeeder');

/**
 * Seeder Runner - Manages and executes all seeders
 */
class SeederRunner extends BaseSeeder {
  constructor() {
    super();
    this.seeders = [
      // Core system settings first
      GeneralSettingsSeeder,
      SettingSeeder,
      LoyaltyLevelSeeder,
      InfluencerLevelSeeder,
      
      // Main entities
      UserSeeder,
      StoreSeeder,
      ProductSeeder,
      CampaignSeeder,
      
      // Transactions and activities
      SaleSeeder,
      PointsTransactionSeeder,
      CommissionSeeder,
      CashbackRuleSeeder,
      CashbackTransactionSeeder,
      PurchaseEntrySeeder,
      OnlinePurchaseSeeder,
      OnlinePurchaseItemSeeder,
      PayoutRequestSeeder,
      
      // Supporting data
      BankDetailsSeeder,
      ScanUploadSeeder,
      BillingCompanyInvoiceSeeder,
      
      // System logs and insights
      ActivityLogSeeder,
      AuditLogSeeder,
      NotificationSeeder,
      RefreshTokenSeeder,
      AIInsightsSeeder
    ];
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
      console.log('   - General Settings (company configuration)');
      console.log('   - Settings (system configuration)');
      console.log('   - Loyalty Levels (customer tiers)');
      console.log('   - Influencer Levels (influencer tiers)');
      console.log('   - Users (admin, managers, customers, influencers)');
      console.log('   - Stores (retail, wholesale, online, mobile)');
      console.log('   - Products (water bottles, subscriptions, services)');
      console.log('   - Campaigns (promotional, onboarding, referral)');
      console.log('   - Sales (customer and influencer transactions)');
      console.log('   - Points Transactions (earned, spent, bonus, referral)');
      console.log('   - Commissions (influencer earnings)');
      console.log('   - Cashback Rules (discount rules)');
      console.log('   - Cashback Transactions (discount applications)');
      console.log('   - Purchase Entries (manual entries)');
      console.log('   - Online Purchases (e-commerce orders)');
      console.log('   - Online Purchase Items (order items)');
      console.log('   - Payout Requests (commission payouts)');
      console.log('   - Bank Details (user banking info)');
      console.log('   - Scan Uploads (receipt processing)');
      console.log('   - Billing Company Invoices (company billing)');
      console.log('   - Activity Logs (user activities)');
      console.log('   - Audit Logs (system changes)');
      console.log('   - Notifications (user notifications)');
      console.log('   - Refresh Tokens (session management)');
      console.log('   - AI Insights (analytics insights)');
    } catch (error) {
      console.error('\n❌ Seeding process failed:', error.message);
      throw error;
    }
  }

  async clearAll() {
    console.log('🗑️  Clearing all seeded data...\n');
    
    try {
      await this.connect();
      
      const collections = [
        'ai_insights',
        'refreshtokens',
        'notifications',
        'auditlogs',
        'activitylogs',
        'billingcompanyinvoice',
        'scanuploads',
        'bank_details',
        'payoutrequests',
        'onlinepurchaseitems',
        'onlinepurchases',
        'purchaseentries',
        'cashbacktransactions',
        'cashbackrules',
        'commissions',
        'pointstransactions',
        'sales',
        'campaigns',
        'products',
        'stores',
        'users',
        'influencerlevels',
        'loyaltylevels',
        'settings',
        'general_settings'
      ];

      for (const collectionName of collections) {
        await this.clearCollection(collectionName);
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
      
      const collections = [
        { name: 'general_settings', description: 'General system settings' },
        { name: 'settings', description: 'System configuration' },
        { name: 'loyaltylevels', description: 'Customer loyalty tiers' },
        { name: 'influencerlevels', description: 'Influencer tiers' },
        { name: 'users', description: 'User accounts' },
        { name: 'stores', description: 'Store locations' },
        { name: 'products', description: 'Product catalog' },
        { name: 'campaigns', description: 'Marketing campaigns' },
        { name: 'sales', description: 'Sales transactions' },
        { name: 'pointstransactions', description: 'Points transactions' },
        { name: 'commissions', description: 'Commission records' },
        { name: 'cashbackrules', description: 'Cashback rules' },
        { name: 'cashbacktransactions', description: 'Cashback transactions' },
        { name: 'purchaseentries', description: 'Purchase entries' },
        { name: 'onlinepurchases', description: 'Online purchases' },
        { name: 'onlinepurchaseitems', description: 'Online purchase items' },
        { name: 'payoutrequests', description: 'Payout requests' },
        { name: 'bank_details', description: 'Bank details' },
        { name: 'scanuploads', description: 'Scan uploads' },
        { name: 'billingcompanyinvoice', description: 'Company invoices' },
        { name: 'activitylogs', description: 'Activity logs' },
        { name: 'auditlogs', description: 'Audit logs' },
        { name: 'notifications', description: 'Notifications' },
        { name: 'refreshtokens', description: 'Refresh tokens' },
        { name: 'ai_insights', description: 'AI insights' }
      ];

      for (const collection of collections) {
        const count = await this.getExistingCount(collection.name);
        const status = count > 0 ? '✅ Seeded' : '⏳ Empty';
        console.log(`${status} - ${collection.name}: ${count} records (${collection.description})`);
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