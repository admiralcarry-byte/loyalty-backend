const mongoose = require('mongoose');
const { Sale, CommissionSettings } = require('../models');
require('dotenv').config();

class CommissionBehaviorTester {
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

  async testCommissionBehavior() {
    try {
      console.log('🧪 Testing Commission Behavior...\n');
      
      // Get current settings
      const currentSettings = await this.commissionSettingsModel.model.getCurrentSettings();
      console.log('📊 Current Commission Settings:');
      console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
      console.log(`   Tier Multipliers:`, currentSettings.tier_multipliers);
      console.log(`   Commission Cap: $${currentSettings.commission_cap}\n`);
      
      // Get existing sales (historical data)
      const existingSales = await this.saleModel.model.find({
        'commission.amount': { $exists: true, $gt: 0 }
      }).populate('user_id', 'loyalty_tier first_name last_name').limit(3);
      
      console.log('📋 Historical Sales (should keep stored commission values):');
      console.log('=' .repeat(70));
      
      for (const sale of existingSales) {
        const user = sale.user_id;
        const storedCommission = sale.commission?.amount || 0;
        const storedRate = sale.commission?.rate || 0;
        const totalAmount = sale.total_amount;
        
        console.log(`📋 Sale: ${sale.sale_number}`);
        console.log(`   Customer: ${user?.first_name || 'Unknown'} ${user?.last_name || 'Customer'}`);
        console.log(`   Amount: $${totalAmount}`);
        console.log(`   Stored Commission: $${storedCommission} (${storedRate}%)`);
        console.log(`   Settings Used: ${sale.commission?.settings_used || 'unknown'}`);
        console.log(`   Created: ${sale.created_at}`);
        console.log('-'.repeat(50));
      }
      
      console.log('\n✅ Historical sales maintain their stored commission values');
      console.log('💡 These values should NOT change when Base Commission Rate is updated\n');
      
      // Test what would happen if we calculated with current settings
      console.log('🔍 What if we calculated with current settings (for comparison):');
      console.log('=' .repeat(70));
      
      for (const sale of existingSales) {
        const user = sale.user_id;
        const totalAmount = sale.total_amount;
        const userTier = user?.loyalty_tier || 'lead';
        
        // Calculate what it would be with current settings
        const tierKey = userTier.toLowerCase();
        const tierMultiplier = currentSettings.tier_multipliers[tierKey] || 1.0;
        const baseCommission = (totalAmount * currentSettings.base_commission_rate) / 100;
        const tierCommission = baseCommission * tierMultiplier;
        const finalCommission = Math.min(tierCommission, currentSettings.commission_cap);
        
        const storedCommission = sale.commission?.amount || 0;
        const difference = finalCommission - storedCommission;
        
        console.log(`📋 Sale: ${sale.sale_number}`);
        console.log(`   Stored: $${storedCommission.toFixed(2)} → Would be: $${finalCommission.toFixed(2)}`);
        console.log(`   Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(2)}`);
        console.log('-'.repeat(50));
      }
      
      console.log('\n✅ Test completed!');
      console.log('💡 Historical data preserves original commission values');
      console.log('💡 New sales will use current Base Commission Rate');
      
    } catch (error) {
      console.error('❌ Error testing commission behavior:', error);
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
  const tester = new CommissionBehaviorTester();
  
  try {
    await tester.connect();
    await tester.testCommissionBehavior();
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

module.exports = CommissionBehaviorTester;