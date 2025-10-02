const mongoose = require('mongoose');
const { Sale, User, CommissionSettings } = require('../models');
require('dotenv').config();

class CommissionRecalculator {
  constructor() {
    this.saleModel = new Sale();
    this.userModel = new User();
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

  async getCurrentSettings() {
    try {
      const settings = await this.commissionSettingsModel.model.getCurrentSettings();
      console.log('📊 Current commission settings:', {
        base_rate: settings.base_commission_rate,
        tier_multipliers: settings.tier_multipliers,
        commission_cap: settings.commission_cap
      });
      return settings;
    } catch (error) {
      console.error('❌ Error getting current settings:', error);
      throw error;
    }
  }

  async calculateCommissionAndCashback(totalAmount, liters, userTier, commissionSettings) {
    try {
      // Calculate commission based on tier multiplier
      const tierKey = userTier.toLowerCase();
      const tierMultiplier = commissionSettings.tier_multipliers[tierKey] || 1.0;
      const baseCommissionRate = commissionSettings.base_commission_rate;
      const commissionCap = commissionSettings.commission_cap || 1000.0;
      
      // Calculate base commission
      const baseCommission = (totalAmount * baseCommissionRate) / 100;
      
      // Apply tier multiplier
      const tierCommission = baseCommission * tierMultiplier;
      
      // Apply commission cap
      const finalCommission = Math.min(tierCommission, commissionCap);
      
      // Calculate effective commission rate for display
      const effectiveRate = (finalCommission / totalAmount) * 100;
      
      // Calculate cashback using per-liter calculation as intended by UI
      const cashbackRate = commissionSettings.cashback_rate;
      const baseCashback = liters * cashbackRate; // Amount per liter (not percentage)
      const cashbackAmount = baseCashback * tierMultiplier; // Apply tier multiplier to cashback
      
      return {
        commissionAmount: Math.round(finalCommission * 100) / 100,
        commissionRate: Math.round(effectiveRate * 100) / 100,
        cashbackAmount: Math.round(cashbackAmount * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating commission and cashback:', error);
      throw error;
    }
  }

  async recalculateCommissions() {
    try {
      console.log('🔄 Starting commission recalculation...');
      
      // Get current settings
      const currentSettings = await this.getCurrentSettings();
      
      // Find all sales that have commission data
      const sales = await this.saleModel.model.find({
        'commission.amount': { $exists: true, $gt: 0 }
      }).populate('user_id', 'loyalty_tier first_name last_name');
      
      console.log(`📋 Found ${sales.length} sales with existing commission data`);
      
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const sale of sales) {
        try {
          const user = sale.user_id;
          if (!user) {
            console.log(`⚠️  Skipping sale ${sale.sale_number} - no user data`);
            continue;
          }
          
          const totalAmount = sale.total_amount;
          const liters = sale.liters_sold || sale.total_liters || 1;
          const userTier = user.loyalty_tier || 'lead';
          
          // Calculate new commission based on current settings
          const { commissionAmount, commissionRate, cashbackAmount } = await this.calculateCommissionAndCashback(
            totalAmount, 
            liters, 
            userTier, 
            currentSettings
          );
          
          // Get old commission for comparison
          const oldCommission = sale.commission?.amount || 0;
          const oldRate = sale.commission?.rate || 0;
          
          // Update the sale with new commission data
          await this.saleModel.model.findByIdAndUpdate(sale._id, {
            $set: {
              'commission.amount': commissionAmount,
              'commission.rate': commissionRate,
              'commission.calculated': true,
              'commission.tier': userTier,
              'commission.settings_used': currentSettings._id || 'current',
              'cashback_earned': cashbackAmount,
              'metadata.commission_settings_snapshot': {
                base_rate: currentSettings.base_commission_rate,
                tier_multipliers: currentSettings.tier_multipliers,
                commission_cap: currentSettings.commission_cap
              }
            }
          });
          
          console.log(`✅ Updated sale ${sale.sale_number} (${user.first_name} ${user.last_name}):`);
          console.log(`   Old: $${oldCommission} (${oldRate}%) → New: $${commissionAmount} (${commissionRate}%)`);
          console.log(`   Tier: ${userTier}, Amount: $${totalAmount}, Liters: ${liters}`);
          
          updatedCount++;
          
        } catch (error) {
          console.error(`❌ Error updating sale ${sale.sale_number}:`, error.message);
          errorCount++;
        }
      }
      
      console.log('\n📊 Recalculation Summary:');
      console.log(`✅ Successfully updated: ${updatedCount} sales`);
      console.log(`❌ Errors: ${errorCount} sales`);
      console.log(`📋 Total processed: ${sales.length} sales`);
      
    } catch (error) {
      console.error('❌ Error during commission recalculation:', error);
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

// Run the script
async function main() {
  const recalculator = new CommissionRecalculator();
  
  try {
    await recalculator.connect();
    await recalculator.recalculateCommissions();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await recalculator.disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = CommissionRecalculator;