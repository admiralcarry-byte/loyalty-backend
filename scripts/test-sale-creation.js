const mongoose = require('mongoose');
const { Sale, CommissionSettings, User, Store } = require('../models');
require('dotenv').config();

async function testSaleCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
    console.log('✅ Connected to MongoDB');
    
    // Get current settings
    const commissionSettingsModel = new CommissionSettings();
    const currentSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    console.log('📊 Current Commission Settings:');
    console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
    console.log(`   Tier Multipliers:`, currentSettings.tier_multipliers);
    console.log(`   Commission Cap: $${currentSettings.commission_cap}\n`);
    
    // Test commission calculation
    const totalAmount = 240;
    const liters = 20;
    const userTier = 'lead';
    
    console.log('🧪 Testing Commission Calculation:');
    console.log(`   Amount: $${totalAmount}`);
    console.log(`   Liters: ${liters}L`);
    console.log(`   Tier: ${userTier}`);
    
    // Calculate commission using current settings
    const tierKey = userTier.toLowerCase();
    const tierMultiplier = currentSettings.tier_multipliers[tierKey] || 1.0;
    const baseCommission = (totalAmount * currentSettings.base_commission_rate) / 100;
    const tierCommission = baseCommission * tierMultiplier;
    const finalCommission = Math.min(tierCommission, currentSettings.commission_cap);
    const effectiveRate = (finalCommission / totalAmount) * 100;
    
    console.log(`   Tier Multiplier: ${tierMultiplier}x`);
    console.log(`   Base Commission: $${baseCommission.toFixed(2)} (${currentSettings.base_commission_rate}%)`);
    console.log(`   Tier Commission: $${tierCommission.toFixed(2)}`);
    console.log(`   Final Commission: $${finalCommission.toFixed(2)}`);
    console.log(`   Effective Rate: ${effectiveRate.toFixed(2)}%`);
    
    // Test the actual sale controller method
    console.log('\n🔧 Testing Sale Controller Method:');
    const SaleController = require('../controllers/saleController');
    const saleController = new SaleController();
    
    const { commissionAmount, commissionRate } = await saleController.calculateCommissionAndCashback(
      totalAmount,
      liters,
      userTier,
      currentSettings
    );
    
    console.log(`   Sale Controller Result: $${commissionAmount} (${commissionRate}%)`);
    
    if (commissionAmount !== finalCommission) {
      console.log('❌ MISMATCH! Sale controller is not using current settings correctly');
    } else {
      console.log('✅ Sale controller is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSaleCreation();