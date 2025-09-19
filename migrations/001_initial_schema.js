const mongoose = require('mongoose');

/**
 * Initial schema migration
 * Creates all collections and indexes for the ÁGUA TWEZAH admin system
 */
module.exports = {
  async up() {
    console.log('Creating initial database schema...');
    
    // Import all models
    const User = require('../schemas/User');
    const Store = require('../schemas/Store');
    const Sale = require('../schemas/Sale');
    const Product = require('../schemas/Product');
    const Campaign = require('../schemas/Campaign');
    const Commission = require('../schemas/Commission');
    const LoyaltyLevel = require('../schemas/LoyaltyLevel');
    const PointsTransaction = require('../schemas/PointsTransaction');
    const Notification = require('../schemas/Notification');
    const AuditLog = require('../schemas/AuditLog');
    const CashbackRule = require('../schemas/CashbackRule');
    const CashbackTransaction = require('../schemas/CashbackTransaction');
    const PurchaseEntry = require('../schemas/PurchaseEntry');
    const Setting = require('../schemas/Setting');
    const RefreshToken = require('../schemas/RefreshToken');
    const OnlinePurchase = require('../schemas/OnlinePurchase');
    const ScanUpload = require('../schemas/ScanUpload');
    const BillingCompanyInvoice = require('../schemas/BillingCompanyInvoice');
    const BankDetails = require('../schemas/BankDetails');
    const InfluencerLevel = require('../schemas/InfluencerLevel');
    const PayoutRequest = require('../schemas/PayoutRequest');
    const ActivityLog = require('../schemas/ActivityLog');
    const GeneralSettings = require('../schemas/GeneralSettings');
    const CommissionRule = require('../schemas/CommissionRule');
    const CommissionSettings = require('../schemas/CommissionSettings');

    // Create collections by ensuring indexes are built
    // Use the actual collection names that Mongoose creates
    const collections = [
      { name: 'users', model: User },
      { name: 'stores', model: Store },
      { name: 'sales', model: Sale },
      { name: 'products', model: Product },
      { name: 'campaigns', model: Campaign },
      { name: 'commissions', model: Commission },
      { name: 'loyaltylevels', model: LoyaltyLevel },
      { name: 'pointstransactions', model: PointsTransaction },
      { name: 'notifications', model: Notification },
      { name: 'auditlogs', model: AuditLog },
      { name: 'cashbackrules', model: CashbackRule },
      { name: 'cashbacktransactions', model: CashbackTransaction },
      { name: 'purchases', model: PurchaseEntry },
      { name: 'settings', model: Setting },
      { name: 'refreshtokens', model: RefreshToken },
      { name: 'onlinepurchases', model: OnlinePurchase },
      { name: 'scanuploads', model: ScanUpload },
      { name: 'billingcompanyinvoice', model: BillingCompanyInvoice },
      { name: 'bank_details', model: BankDetails },
      { name: 'influencerlevels', model: InfluencerLevel },
      { name: 'payoutrequests', model: PayoutRequest },
      { name: 'activitylogs', model: ActivityLog },
      { name: 'general_settings', model: GeneralSettings },
      { name: 'commissionrules', model: CommissionRule },
      { name: 'commissionsettings', model: CommissionSettings }
    ];

    for (const collection of collections) {
      try {
        // Create collection by using the model's collection property
        // This ensures the collection exists in MongoDB
        await mongoose.connection.db.createCollection(collection.name);
        console.log(`✅ Created collection and indexes for: ${collection.name}`);
      } catch (error) {
        // If collection already exists, that's fine
        if (error.code === 48) { // NamespaceExists error
          console.log(`ℹ️  Collection ${collection.name} already exists`);
        } else {
          console.error(`❌ Error creating collection ${collection.name}:`, error.message);
          throw error;
        }
      }
    }

    // Create default general settings
    try {
      const existingSettings = await GeneralSettings.findOne({ is_active: true });
      if (!existingSettings) {
        const defaultSettings = new GeneralSettings({
          app_name: 'ÁGUA TWEZAH',
          support_email: 'support@aguatwezah.com',
          currency: 'USD',
          app_description: 'Premium Water Loyalty Program',
          timezone: 'Africa/Luanda',
          language: 'Portuguese',
          is_active: true
        });
        await defaultSettings.save();
        console.log('✅ Created default general settings');
      } else {
        console.log('✅ General settings already exist');
      }
    } catch (error) {
      console.error('❌ Error creating default general settings:', error.message);
      throw error;
    }

    // Create default loyalty levels
    try {
      const existingLevels = await LoyaltyLevel.countDocuments();
      if (existingLevels === 0) {
        const defaultLevels = [
          {
            name: 'Lead',
            code: 'LEAD',
            tier: 'lead',
            level_number: 1,
            description: 'Entry level for new customers',
            requirements: {
              minimum_liters: 0,
              minimum_points: 0,
              minimum_purchases: 0,
              minimum_spend: 0,
              minimum_referrals: 0
            },
            benefits: {
              points_multiplier: 1.0,
              cashback_percentage: 0,
              discount_percentage: 0,
              referral_bonus: 0,
              free_delivery: false,
              priority_support: false,
              exclusive_offers: false
            },
            is_active: true
          },
          {
            name: 'Silver',
            code: 'SILVER',
            tier: 'silver',
            level_number: 2,
            description: 'Silver tier for regular customers',
            requirements: {
              minimum_liters: 50,
              minimum_points: 100,
              minimum_purchases: 5,
              minimum_spend: 100,
              minimum_referrals: 0
            },
            benefits: {
              points_multiplier: 1.2,
              cashback_percentage: 2,
              discount_percentage: 5,
              referral_bonus: 5,
              free_delivery: false,
              priority_support: true,
              exclusive_offers: false
            },
            is_active: true
          },
          {
            name: 'Gold',
            code: 'GOLD',
            tier: 'gold',
            level_number: 3,
            description: 'Gold tier for loyal customers',
            requirements: {
              minimum_liters: 200,
              minimum_points: 500,
              minimum_purchases: 20,
              minimum_spend: 500,
              minimum_referrals: 2
            },
            benefits: {
              points_multiplier: 1.5,
              cashback_percentage: 5,
              discount_percentage: 10,
              referral_bonus: 10,
              free_delivery: true,
              priority_support: true,
              exclusive_offers: true
            },
            is_active: true
          },
          {
            name: 'Platinum',
            code: 'PLATINUM',
            tier: 'platinum',
            level_number: 4,
            description: 'Platinum tier for VIP customers',
            requirements: {
              minimum_liters: 500,
              minimum_points: 1000,
              minimum_purchases: 50,
              minimum_spend: 1000,
              minimum_referrals: 5
            },
            benefits: {
              points_multiplier: 2.0,
              cashback_percentage: 10,
              discount_percentage: 15,
              referral_bonus: 20,
              free_delivery: true,
              priority_support: true,
              exclusive_offers: true
            },
            is_active: true
          }
        ];

        await LoyaltyLevel.insertMany(defaultLevels);
        console.log('✅ Created default loyalty levels');
      } else {
        console.log('✅ Loyalty levels already exist');
      }
    } catch (error) {
      console.error('❌ Error creating default loyalty levels:', error.message);
      throw error;
    }

    // Create default influencer levels
    try {
      const existingInfluencerLevels = await InfluencerLevel.countDocuments();
      if (existingInfluencerLevels === 0) {
        const defaultInfluencerLevels = [
          {
            name: 'Silver',
            level_order: 1,
            required_referrals: 0,
            required_active_clients: 5,
            commission_rate: 5,
            benefits: ['5% commission on referrals', 'Basic marketing materials'],
            requirements: ['Minimum 5 active clients', 'Basic social media presence'],
            is_active: true
          },
          {
            name: 'Gold',
            level_order: 2,
            required_referrals: 10,
            required_active_clients: 20,
            commission_rate: 7,
            benefits: ['7% commission on referrals', 'Enhanced marketing materials', 'Monthly bonus'],
            requirements: ['Minimum 20 active clients', 'Regular social media activity', 'Monthly referral target'],
            is_active: true
          },
          {
            name: 'Platinum',
            level_order: 3,
            required_referrals: 50,
            required_active_clients: 100,
            commission_rate: 10,
            benefits: ['10% commission on referrals', 'Premium marketing materials', 'Quarterly bonus', 'Exclusive events'],
            requirements: ['Minimum 100 active clients', 'Strong social media presence', 'Quarterly referral target', 'Brand ambassador status'],
            is_active: true
          }
        ];

        await InfluencerLevel.insertMany(defaultInfluencerLevels);
        console.log('✅ Created default influencer levels');
      } else {
        console.log('✅ Influencer levels already exist');
      }
    } catch (error) {
      console.error('❌ Error creating default influencer levels:', error.message);
      throw error;
    }

    console.log('✅ Initial schema migration completed successfully');
  },

  async down() {
    console.log('Rolling back initial schema migration...');
    
    // Drop all collections
    const collections = [
      'users', 'stores', 'sales', 'products', 'campaigns', 'commissions',
      'loyaltylevels', 'pointstransactions', 'notifications', 'auditlogs',
      'cashbackrules', 'cashbacktransactions', 'purchases', 'settings',
      'refreshtokens', 'onlinepurchases', 'scanuploads',
      'billingcompanyinvoice', 'bank_details', 'influencerlevels', 'ai_insights',
      'payoutrequests', 'activitylogs', 'general_settings', 'commissionrules',
      'commissionsettings'
    ];

    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.collection(collectionName).drop();
        console.log(`✅ Dropped collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 26) {
          // Collection doesn't exist, which is fine
          console.log(`ℹ️  Collection ${collectionName} doesn't exist, skipping`);
        } else {
          console.error(`❌ Error dropping collection ${collectionName}:`, error.message);
          throw error;
        }
      }
    }

    console.log('✅ Initial schema migration rolled back successfully');
  }
};