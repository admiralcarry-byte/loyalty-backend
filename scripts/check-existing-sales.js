const mongoose = require('mongoose');
const { Sale, CommissionSettings } = require('../models');
require('dotenv').config();

async function checkExistingSales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
    console.log('✅ Connected to MongoDB');
    
    // Get current settings
    const commissionSettingsModel = new CommissionSettings();
    const currentSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    console.log('📊 Current Commission Settings:');
    console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
    console.log(`   Settings ID: ${currentSettings._id}\n`);
    
    // Get recent sales
    const saleModel = new Sale();
    const sales = await saleModel.model.find({})
      .populate('user_id', 'first_name last_name loyalty_tier')
      .sort({ created_at: -1 })
      .limit(10);
    
    console.log('📋 Recent Sales:');
    console.log('=' .repeat(80));
    
    for (const sale of sales) {
      const user = sale.user_id;
      const commission = sale.commission?.amount || 0;
      const rate = sale.commission?.rate || 0;
      const settingsUsed = sale.commission?.settings_used || 'unknown';
      const created = sale.created_at || sale.createdAt;
      
      console.log(`📋 Sale: ${sale.sale_number}`);
      console.log(`   Customer: ${user?.first_name || 'Unknown'} ${user?.last_name || 'Customer'}`);
      console.log(`   Amount: $${sale.total_amount}`);
      console.log(`   Commission: $${commission} (${rate}%)`);
      console.log(`   Settings Used: ${settingsUsed}`);
      console.log(`   Created: ${created}`);
      console.log(`   Is Current Settings: ${settingsUsed === currentSettings._id.toString()}`);
      console.log('-'.repeat(60));
    }
    
    // Check if any sales are using old settings
    const oldSales = sales.filter(sale => 
      sale.commission?.settings_used && 
      sale.commission.settings_used !== currentSettings._id.toString()
    );
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Sales Checked: ${sales.length}`);
    console.log(`   Using Current Settings: ${sales.length - oldSales.length}`);
    console.log(`   Using Old Settings: ${oldSales.length}`);
    
    if (oldSales.length > 0) {
      console.log('\n⚠️  Sales using old settings (these will show old commission rates):');
      oldSales.forEach(sale => {
        console.log(`   - ${sale.sale_number}: $${sale.commission?.amount} (${sale.commission?.rate}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkExistingSales();