const mongoose = require('mongoose');
const { Sale, CommissionSettings } = require('../models');
require('dotenv').config();

async function checkCurrentSales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin');
    console.log('✅ Connected to MongoDB');
    
    // Get current settings
    const commissionSettingsModel = new CommissionSettings();
    const currentSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    console.log('📊 Current Commission Settings:');
    console.log(`   Base Rate: ${currentSettings.base_commission_rate}%`);
    console.log(`   Settings ID: ${currentSettings._id}\n`);
    
    // Get all sales sorted by creation time
    const saleModel = new Sale();
    const sales = await saleModel.model.find({})
      .populate('user_id', 'first_name last_name loyalty_tier')
      .sort({ created_at: 1 }); // Sort by creation time ascending
    
    console.log('📋 All Sales (in chronological order):');
    console.log('=' .repeat(100));
    
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i];
      const user = sale.user_id;
      const commission = sale.commission?.amount || 0;
      const rate = sale.commission?.rate || 0;
      const settingsUsed = sale.commission?.settings_used || 'unknown';
      const created = sale.created_at || sale.createdAt;
      const totalAmount = sale.total_amount;
      
      console.log(`${i + 1}. Sale: ${sale.sale_number}`);
      console.log(`   Customer: ${user?.first_name || 'Unknown'} ${user?.last_name || 'Customer'}`);
      console.log(`   Amount: $${totalAmount}`);
      console.log(`   Commission: $${commission} (${rate}%)`);
      console.log(`   Settings Used: ${settingsUsed}`);
      console.log(`   Created: ${created}`);
      console.log(`   Commission per $100: $${(commission / totalAmount * 100).toFixed(2)}`);
      console.log('-'.repeat(80));
    }
    
    // Check if there are any patterns
    const uniqueRates = [...new Set(sales.map(sale => sale.commission?.rate || 0))];
    console.log(`\n📊 Unique Commission Rates Found: ${uniqueRates.join('%, ')}%`);
    
    if (uniqueRates.length === 1) {
      console.log('⚠️  All sales have the same commission rate! This suggests:');
      console.log('   1. All sales were created at the same rate');
      console.log('   2. The rate was never changed between sales');
      console.log('   3. There might be a caching issue');
    } else {
      console.log('✅ Sales have different commission rates - system is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCurrentSales();