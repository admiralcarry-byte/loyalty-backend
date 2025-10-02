const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Commission Settings seeder - Creates initial commission settings
 */
class CommissionSettingsSeeder extends BaseSeeder {
  async seed() {
    console.log('💰 Seeding commission settings...');
    
    const existingCount = await this.getExistingCount('commissionsettings');
    if (existingCount > 0) {
      console.log(`ℹ️  Commission settings already exist (${existingCount} records). Skipping...`);
      return;
    }

    // Get admin user for created_by field
    const adminUser = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('⚠️  No admin user found. Skipping commission settings seeding...');
      return;
    }

    const commissionSettings = {
      base_commission_rate: 5.0,
      cashback_rate: 2.0,
      tier_multipliers: {
        lead: 1.0,
        silver: 1.2,
        gold: 1.5,
        platinum: 2.0
      },
      minimum_active_users: 10,
      payout_threshold: 50.0,
      payout_frequency: 'monthly',
      auto_approval: false,
      commission_cap: 1000.0,
      is_active: true,
      created_by: adminUser._id,
      updated_by: adminUser._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.seedCollection('commissionsettings', [commissionSettings], { clearFirst: false });
    
    console.log('✅ Commission settings seeded successfully');
    console.log('   - Base commission rate: 5.0%');
    console.log('   - Cashback rate: 2.0%');
    console.log('   - Tier multipliers: Lead(1.0x), Silver(1.2x), Gold(1.5x), Platinum(2.0x)');
    console.log('   - Payout threshold: $50.00');
    console.log('   - Payout frequency: Monthly');
  }
}

module.exports = CommissionSettingsSeeder;