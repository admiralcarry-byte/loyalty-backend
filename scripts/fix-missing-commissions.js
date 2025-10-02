#!/usr/bin/env node

/**
 * Script to fix missing commission records for existing sales
 * This will create commission records for sales that don't have them
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Sale, Commission } = require('../models');

class CommissionFixer {
  constructor() {
    this.saleModel = new Sale();
    this.commissionModel = new Commission();
  }

  async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  async findSalesWithoutCommissions() {
    try {
      // Find all sales
      const allSales = await this.saleModel.model.find({}).lean();
      console.log(`📊 Found ${allSales.length} total sales`);

      // Find all commissions
      const allCommissions = await this.commissionModel.model.find({}).lean();
      console.log(`💰 Found ${allCommissions.length} total commissions`);

      // Get sale IDs that have commissions
      const salesWithCommissions = new Set(
        allCommissions.map(commission => commission.sale.toString())
      );

      // Find sales without commissions
      const salesWithoutCommissions = allSales.filter(
        sale => !salesWithCommissions.has(sale._id.toString())
      );

      console.log(`🔍 Found ${salesWithoutCommissions.length} sales without commission records`);
      return salesWithoutCommissions;
    } catch (error) {
      console.error('❌ Error finding sales without commissions:', error);
      throw error;
    }
  }

  async createCommissionForSale(sale) {
    try {
      // Calculate commission amount (5% default rate)
      const commissionRate = 5;
      const commissionAmount = (sale.total_amount * commissionRate) / 100;

      // Generate commission number
      const commissionNumber = this.generateCommissionNumber();

      // Create commission record
      const commissionData = {
        commission_number: commissionNumber,
        user: sale.user_id,
        store: sale.store_id,
        sale: sale._id,
        type: 'sale_commission',
        status: 'pending',
        amount: commissionAmount,
        rate: commissionRate,
        base_amount: sale.total_amount,
        currency: 'AOA',
        notes: `Retroactive commission for sale ${sale.sale_number}`,
        calculated_at: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      await this.commissionModel.model.create(commissionData);
      return commissionAmount;
    } catch (error) {
      console.error(`❌ Error creating commission for sale ${sale.sale_number}:`, error);
      throw error;
    }
  }

  generateCommissionNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `COM${year}${month}${day}${timestamp}`;
  }

  async fixMissingCommissions() {
    try {
      console.log('🚀 Starting commission fix process...\n');

      // Find sales without commissions
      const salesWithoutCommissions = await this.findSalesWithoutCommissions();

      if (salesWithoutCommissions.length === 0) {
        console.log('✅ All sales already have commission records!');
        return;
      }

      console.log(`\n📝 Creating commission records for ${salesWithoutCommissions.length} sales...\n`);

      let successCount = 0;
      let errorCount = 0;
      let totalCommissionAmount = 0;

      for (const sale of salesWithoutCommissions) {
        try {
          const commissionAmount = await this.createCommissionForSale(sale);
          totalCommissionAmount += commissionAmount;
          successCount++;
          console.log(`✅ Created commission for sale ${sale.sale_number}: $${commissionAmount.toFixed(2)}`);
        } catch (error) {
          errorCount++;
          console.log(`❌ Failed to create commission for sale ${sale.sale_number}`);
        }
      }

      console.log('\n📊 Commission Fix Summary:');
      console.log(`✅ Successfully created: ${successCount} commissions`);
      console.log(`❌ Failed to create: ${errorCount} commissions`);
      console.log(`💰 Total commission amount: $${totalCommissionAmount.toFixed(2)}`);

      if (errorCount > 0) {
        console.log('\n⚠️  Some commissions failed to create. Check the errors above.');
      } else {
        console.log('\n🎉 All missing commissions have been successfully created!');
      }

    } catch (error) {
      console.error('❌ Error in commission fix process:', error);
      throw error;
    }
  }

  async run() {
    try {
      await this.connectToDatabase();
      await this.fixMissingCommissions();
    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log('\n👋 Disconnected from MongoDB');
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const fixer = new CommissionFixer();
  fixer.run();
}

module.exports = CommissionFixer;