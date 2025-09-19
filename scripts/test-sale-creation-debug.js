const mongoose = require('mongoose');
const { Sale, CommissionSettings, User, Store } = require('../models');
require('dotenv').config();

async function testSaleCreationDebug() {
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
    
    // Get test user and store
    const userModel = new User();
    const testUser = await userModel.model.findOne({ role: { $in: ['user', 'customer', 'influencer'] } });
    
    const storeModel = new Store();
    const testStore = await storeModel.model.findOne({});
    
    if (!testUser || !testStore) {
      console.log('❌ No test user or store found');
      return;
    }
    
    console.log('👤 Test User:', testUser.first_name, testUser.last_name, `(${testUser.loyalty_tier})`);
    console.log('🏪 Test Store:', testStore.name);
    
    // Test with different rates
    const testRates = [5, 10, 15];
    
    for (const testRate of testRates) {
      console.log(`\n🧪 Testing Sale Creation with ${testRate}% rate:`);
      console.log('=' .repeat(60));
      
      // Update the commission settings to the test rate
      await commissionSettingsModel.model.findOneAndUpdate(
        { is_active: true },
        { base_commission_rate: testRate },
        { new: true }
      );
      
      // Verify the rate was updated
      const updatedSettings = await commissionSettingsModel.model.getCurrentSettings();
      console.log(`   Updated rate to: ${updatedSettings.base_commission_rate}%`);
      
      // Create a test sale
      const saleData = {
        customer: testUser.first_name,
        liters: 10,
        amount: 100,
        location: testStore.name,
        paymentMethod: 'cash'
      };
      
      console.log(`   Creating sale: $${saleData.amount}, ${saleData.liters}L`);
      
      try {
        const createdSale = await saleController.createSale(saleData);
        
        console.log(`   ✅ Sale Created: ${createdSale.sale_number}`);
        console.log(`   Commission Amount: $${createdSale.commission?.amount || 0}`);
        console.log(`   Commission Rate: ${createdSale.commission?.rate || 0}%`);
        console.log(`   Settings Used: ${createdSale.commission?.settings_used || 'unknown'}`);
        
        const expectedCommission = (saleData.amount * testRate) / 100;
        const actualCommission = createdSale.commission?.amount || 0;
        
        console.log(`   Expected: $${expectedCommission.toFixed(2)}`);
        console.log(`   Actual: $${actualCommission.toFixed(2)}`);
        console.log(`   Match: ${Math.abs(actualCommission - expectedCommission) < 0.01 ? '✅' : '❌'}`);
        
        if (Math.abs(actualCommission - expectedCommission) >= 0.01) {
          console.log('   ❌ COMMISSION MISMATCH! The sale creation is not using the current rate!');
        }
        
      } catch (error) {
        console.log(`   ❌ Error creating sale: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSaleCreationDebug();