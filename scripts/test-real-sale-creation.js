const mongoose = require('mongoose');
const { Sale, CommissionSettings, User, Store } = require('../models');
require('dotenv').config();

async function testRealSaleCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
    console.log('✅ Connected to MongoDB');
    
    // Get current settings
    const commissionSettingsModel = new CommissionSettings();
    const currentSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    console.log('📊 Current Commission Settings:');
    console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
    console.log(`   Settings ID: ${currentSettings._id}\n`);
    
    // Test the sale creation process step by step
    const saleController = require('../controllers/saleController');
    
    // Get a test user
    const userModel = new User();
    const testUser = await userModel.model.findOne({ role: { $in: ['user', 'customer', 'influencer'] } });
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }
    
    console.log('👤 Test User:');
    console.log(`   Name: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   Tier: ${testUser.loyalty_tier}\n`);
    
    // Get an existing store
    const storeModel = new Store();
    const testStore = await storeModel.model.findOne({});
    if (!testStore) {
      console.log('❌ No test store found');
      return;
    }
    
    console.log('🏪 Test Store:');
    console.log(`   Name: ${testStore.name}\n`);
    
    // Test sale data
    const saleData = {
      customer: testUser.first_name,
      liters: 20,
      amount: 240,
      location: testStore.name,
      paymentMethod: 'cash'
    };
    
    console.log('🧪 Testing Sale Creation:');
    console.log(`   Amount: $${saleData.amount}`);
    console.log(`   Liters: ${saleData.liters}L`);
    console.log(`   User Tier: ${testUser.loyalty_tier}\n`);
    
    // Create the sale
    const createdSale = await saleController.createSale(saleData);
    
    console.log('✅ Sale Created:');
    console.log(`   Sale Number: ${createdSale.sale_number}`);
    console.log(`   Commission Amount: $${createdSale.commission?.amount || 0}`);
    console.log(`   Commission Rate: ${createdSale.commission?.rate || 0}%`);
    console.log(`   Settings Used: ${createdSale.commission?.settings_used || 'unknown'}`);
    
    // Check what the commission should be
    const expectedCommission = (saleData.amount * currentSettings.base_commission_rate) / 100;
    const actualCommission = createdSale.commission?.amount || 0;
    
    console.log(`\n🔍 Analysis:`);
    console.log(`   Expected Commission: $${expectedCommission.toFixed(2)} (${currentSettings.base_commission_rate}%)`);
    console.log(`   Actual Commission: $${actualCommission.toFixed(2)}`);
    
    if (Math.abs(actualCommission - expectedCommission) < 0.01) {
      console.log('✅ Commission calculation is working correctly!');
    } else {
      console.log('❌ Commission calculation is NOT working correctly!');
      console.log(`   Difference: $${(actualCommission - expectedCommission).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testRealSaleCreation();