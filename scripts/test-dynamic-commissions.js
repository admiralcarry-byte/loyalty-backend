const mongoose = require('mongoose');
const { Sale, CommissionSettings } = require('../models');
require('dotenv').config();

class CommissionTester {
  constructor() {
    this.saleModel = new Sale();
    this.commissionSettingsModel = new CommissionSettings();
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async testDynamicCommissions() {
    try {
      console.log('🧪 Testing dynamic commission calculations...\n');
      
      // Get current settings
      const currentSettings = await this.commissionSettingsModel.model.getCurrentSettings();
      console.log('📊 Current Commission Settings:');
      console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
      console.log(`   Tier Multipliers:`, currentSettings.tier_multipliers);
      console.log(`   Commission Cap: $${currentSettings.commission_cap}\n`);
      
      // Get a few sales to test
      const sales = await this.saleModel.model.find({}).populate('user_id', 'loyalty_tier first_name last_name').limit(3);
      
      console.log('🔍 Testing Commission Calculations:');
      console.log('=' .repeat(60));
      
      for (const sale of sales) {
        const user = sale.user_id;
        const totalAmount = sale.total_amount;
        const liters = sale.liters_sold || sale.total_liters || 1;
        const userTier = user?.loyalty_tier || 'lead';
        
        // Calculate commission using current settings
        const tierKey = userTier.toLowerCase();
        const tierMultiplier = currentSettings.tier_multipliers[tierKey] || 1.0;
        const baseCommission = (totalAmount * currentSettings.base_commission_rate) / 100;
        const tierCommission = baseCommission * tierMultiplier;
        const finalCommission = Math.min(tierCommission, currentSettings.commission_cap);
        
        console.log(`📋 Sale: ${sale.sale_number}`);
        console.log(`   Customer: ${user?.first_name || 'Unknown'} ${user?.last_name || 'Customer'}`);
        console.log(`   Amount: $${totalAmount}`);
        console.log(`   Liters: ${liters}L`);
        console.log(`   Tier: ${userTier} (${tierMultiplier}x multiplier)`);
        console.log(`   Base Commission: $${baseCommission.toFixed(2)} (${currentSettings.base_commission_rate}%)`);
        console.log(`   Tier Commission: $${tierCommission.toFixed(2)}`);
        console.log(`   Final Commission: $${finalCommission.toFixed(2)}`);
        console.log(`   Rate: ${((finalCommission / totalAmount) * 100).toFixed(2)}%`);
        console.log('-'.repeat(40));
      }
      
      console.log('\n✅ Dynamic commission calculation test completed!');
      console.log('💡 All calculations are now based on current Base Commission Rate');
      
    } catch (error) {
      console.error('❌ Error testing dynamic commissions:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }
}

// Run the test
async function main() {
  const tester = new CommissionTester();
  
  try {
    await tester.connect();
    await tester.testDynamicCommissions();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await tester.disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = CommissionTester;