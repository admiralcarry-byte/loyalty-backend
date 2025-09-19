const mongoose = require('mongoose');
const { CommissionSettings } = require('../models');
require('dotenv').config();

async function checkSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
    console.log('✅ Connected to MongoDB');
    
    const commissionSettingsModel = new CommissionSettings();
    const currentSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    console.log('📊 Current Commission Settings in Database:');
    console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
    console.log(`   Tier Multipliers:`, currentSettings.tier_multipliers);
    console.log(`   Commission Cap: $${currentSettings.commission_cap}`);
    console.log(`   Settings ID: ${currentSettings._id}`);
    console.log(`   Is Active: ${currentSettings.is_active}`);
    
    // Also check all settings
    const allSettings = await commissionSettingsModel.model.find({}).sort({ created_at: -1 });
    console.log('\n📋 All Commission Settings:');
    allSettings.forEach((setting, index) => {
      console.log(`   ${index + 1}. Base Rate: ${setting.base_commission_rate}%, Active: ${setting.is_active}, Created: ${setting.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSettings();