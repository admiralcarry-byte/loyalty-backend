const mongoose = require('mongoose');
const { Sale, CommissionSettings } = require('../models');
require('dotenv').config();

async function debugCommissionIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
    console.log('✅ Connected to MongoDB');
    
    // Get current settings
    const commissionSettingsModel = new CommissionSettings();
    const currentSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    console.log('📊 Current Commission Settings:');
    console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
    console.log(`   Settings ID: ${currentSettings._id}`);
    console.log(`   Is Active: ${currentSettings.is_active}\n`);
    
    // Get all sales and check their commission details
    const saleModel = new Sale();
    const sales = await saleModel.model.find({})
      .populate('user_id', 'first_name last_name loyalty_tier')
      .sort({ created_at: -1 });
    
    console.log('📋 All Sales Analysis:');
    console.log('=' .repeat(100));
    
    for (const sale of sales) {
      const user = sale.user_id;
      const commission = sale.commission?.amount || 0;
      const rate = sale.commission?.rate || 0;
      const settingsUsed = sale.commission?.settings_used || 'unknown';
      const created = sale.created_at || sale.createdAt;
      const totalAmount = sale.total_amount;
      
      // Calculate what the commission should be based on stored settings
      const expectedCommission = (totalAmount * rate) / 100;
      
      console.log(`📋 Sale: ${sale.sale_number}`);
      console.log(`   Customer: ${user?.first_name || 'Unknown'} ${user?.last_name || 'Customer'}`);
      console.log(`   Amount: $${totalAmount}`);
      console.log(`   Stored Commission: $${commission}`);
      console.log(`   Stored Rate: ${rate}%`);
      console.log(`   Expected Commission: $${expectedCommission.toFixed(2)}`);
      console.log(`   Settings Used: ${settingsUsed}`);
      console.log(`   Created: ${created}`);
      console.log(`   Match: ${Math.abs(commission - expectedCommission) < 0.01 ? '✅' : '❌'}`);
      console.log('-'.repeat(80));
    }
    
    // Check if there are any commission settings with different rates
    const allSettings = await commissionSettingsModel.model.find({}).sort({ created_at: -1 });
    console.log('\n📊 All Commission Settings in Database:');
    allSettings.forEach((setting, index) => {
      console.log(`   ${index + 1}. Rate: ${setting.base_commission_rate}%, Active: ${setting.is_active}, ID: ${setting._id}, Created: ${setting.created_at}`);
    });
    
    // Test the sale creation process step by step
    console.log('\n🧪 Testing Sale Creation Process:');
    console.log('=' .repeat(50));
    
    const SaleController = require('../controllers/saleController');
    const saleController = require('../controllers/saleController');
    
    // Test with different rates
    const testRates = [5, 10, 15];
    
    for (const testRate of testRates) {
      console.log(`\n🔧 Testing with ${testRate}% rate:`);
      
      // Temporarily update the commission settings
      const tempSettings = await commissionSettingsModel.model.findOneAndUpdate(
        { is_active: true },
        { base_commission_rate: testRate },
        { new: true }
      );
      
      console.log(`   Updated rate to: ${tempSettings.base_commission_rate}%`);
      
      // Test commission calculation
      const testAmount = 100;
      const testLiters = 10;
      const testTier = 'lead';
      
      const { commissionAmount, commissionRate } = await saleController.calculateCommissionAndCashback(
        testAmount,
        testLiters,
        testTier,
        tempSettings
      );
      
      console.log(`   Amount: $${testAmount}`);
      console.log(`   Calculated Commission: $${commissionAmount}`);
      console.log(`   Calculated Rate: ${commissionRate}%`);
      console.log(`   Expected: $${(testAmount * testRate / 100).toFixed(2)}`);
      console.log(`   Match: ${Math.abs(commissionAmount - (testAmount * testRate / 100)) < 0.01 ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugCommissionIssue();