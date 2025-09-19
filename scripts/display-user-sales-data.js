const mongoose = require('mongoose');
const database = require('../config/database');
const { User, Sale } = require('../models');

class UserSalesDataDisplay {
  constructor() {
    this.userModel = new User();
    this.saleModel = new Sale();
  }

  async connect() {
    try {
      await database.connect();
      console.log('✅ Connected to database successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async displayUserSalesData() {
    try {
      console.log('\n🔍 Fetching user and sales data with cashback and commission information...\n');
      
      // Using aggregation pipeline to join users and sales
      const pipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_details'
          }
        },
        {
          $unwind: '$user_details'
        },
        {
          $project: {
            sale_id: '$_id',
            sale_number: 1,
            transaction_id: 1,
            total_amount: 1,
            cashback_earned: 1,
            points_earned: 1,
            commission: 1,
            createdAt: 1,
            created_at: 1,
            user_id: 1,
            currency: 1,
            user_details: {
              username: 1,
              first_name: 1,
              last_name: 1,
              email: 1,
              loyalty_tier: 1,
              points_balance: 1,
              total_points_earned: 1,
              total_purchases: 1,
              total_liters: 1
            }
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $limit: 20 // Limit to 20 most recent sales for readability
        }
      ];

      const results = await this.saleModel.model.aggregate(pipeline);
      
      if (results.length === 0) {
        console.log('❌ No sales data found in the database');
        return;
      }

      console.log('📊 USER SALES DATA WITH CASHBACK AND COMMISSION INFORMATION');
      console.log('=' .repeat(100));
      console.log('');

      results.forEach((sale, index) => {
        console.log(`📋 SALE #${index + 1}`);
        console.log('─'.repeat(50));
        console.log(`🆔 Sale ID: ${sale.sale_id}`);
        console.log(`📄 Sale Number: ${sale.sale_number || 'N/A'}`);
        console.log(`🔢 Transaction ID: ${sale.transaction_id || 'N/A'}`);
        console.log(`💰 Total Amount: ${sale.total_amount} ${sale.currency || 'BRL'}`);
        console.log(`💵 Cashback Earned: ${sale.cashback_earned || 0}`);
        console.log(`⭐ Points Earned: ${sale.points_earned || 0}`);
        console.log(`💼 Commission Amount: ${sale.commission?.amount || 0}`);
        console.log(`📊 Commission Rate: ${sale.commission?.rate || 0}%`);
        console.log(`✅ Commission Calculated: ${sale.commission?.calculated ? 'Yes' : 'No'}`);
        if (sale.commission?.amount > 0) {
          const commissionPercentage = ((sale.commission.amount / sale.total_amount) * 100).toFixed(2);
          console.log(`📈 Commission as % of Sale: ${commissionPercentage}%`);
        }
        console.log(`💵 Cashback Rate: ${sale.total_amount > 0 ? ((sale.cashback_earned / sale.total_amount) * 100).toFixed(2) : 0}%`);
        const saleDate = sale.createdAt || sale.created_at;
        console.log(`📅 Sale Date: ${saleDate ? new Date(saleDate).toLocaleString() : 'N/A'}`);
        
        console.log('');
        
        console.log('👤 BUYER INFORMATION');
        console.log('─'.repeat(30));
        console.log(`🆔 User ID: ${sale.user_id}`);
        console.log(`👤 Username: ${sale.user_details.username}`);
        console.log(`📛 Full Name: ${sale.user_details.first_name} ${sale.user_details.last_name || ''}`);
        console.log(`📧 Email: ${sale.user_details.email}`);
        console.log(`🏆 Loyalty Tier: ${sale.user_details.loyalty_tier}`);
        console.log(`⭐ Current Points Balance: ${sale.user_details.points_balance}`);
        console.log(`⭐ Total Points Earned: ${sale.user_details.total_points_earned}`);
        console.log(`🛒 Total Purchases: ${sale.user_details.total_purchases}`);
        console.log(`💧 Total Liters: ${sale.user_details.total_liters}`);
        console.log('');
        console.log('=' .repeat(100));
        console.log('');
      });

      // Summary statistics for displayed results
      console.log('📈 SUMMARY STATISTICS (Displayed Results)');
      console.log('=' .repeat(60));
      console.log(`📊 Total Sales Displayed: ${results.length}`);
      console.log(`💰 Total Revenue: ${results.reduce((sum, sale) => sum + sale.total_amount, 0).toFixed(2)}`);
      console.log(`💵 Total Cashback Earned: ${results.reduce((sum, sale) => sum + (sale.cashback_earned || 0), 0).toFixed(2)}`);
      console.log(`⭐ Total Points Earned: ${results.reduce((sum, sale) => sum + (sale.points_earned || 0), 0)}`);
      console.log(`💼 Total Commission Amount: ${results.reduce((sum, sale) => sum + (sale.commission?.amount || 0), 0).toFixed(2)}`);
      console.log(`👥 Unique Buyers: ${new Set(results.map(sale => sale.user_id.toString())).size}`);
      console.log('');

      // Overall database statistics
      const summary = await this.getSummaryStatistics();
      console.log('📊 OVERALL DATABASE STATISTICS');
      console.log('=' .repeat(50));
      console.log(`📊 Total Sales in Database: ${summary.totalSales}`);
      console.log(`👥 Total Users in Database: ${summary.totalUsers}`);
      console.log(`💰 Total Revenue in Database: ${summary.totalRevenue.toFixed(2)}`);
      console.log(`💵 Total Cashback in Database: ${summary.totalCashback.toFixed(2)}`);
      console.log(`💼 Total Commission in Database: ${summary.totalCommission.toFixed(2)}`);
      console.log(`📈 Average Sale Amount: ${summary.totalSales > 0 ? (summary.totalRevenue / summary.totalSales).toFixed(2) : 0}`);
      console.log(`📈 Average Cashback per Sale: ${summary.totalSales > 0 ? (summary.totalCashback / summary.totalSales).toFixed(2) : 0}`);
      console.log(`📈 Average Commission per Sale: ${summary.totalSales > 0 ? (summary.totalCommission / summary.totalSales).toFixed(2) : 0}`);

    } catch (error) {
      console.error('❌ Error displaying user sales data:', error);
      throw error;
    }
  }

  async getSummaryStatistics() {
    try {
      // Get total sales count
      const totalSales = await this.saleModel.model.countDocuments();
      
      // Get total users count
      const totalUsers = await this.userModel.model.countDocuments();
      
      // Get aggregated sales data
      const salesAggregation = await this.saleModel.model.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_amount' },
            totalCashback: { $sum: '$cashback_earned' },
            totalCommission: { $sum: '$commission.amount' }
          }
        }
      ]);

      const summary = salesAggregation[0] || {
        totalRevenue: 0,
        totalCashback: 0,
        totalCommission: 0
      };

      return {
        totalSales,
        totalUsers,
        totalRevenue: summary.totalRevenue,
        totalCashback: summary.totalCashback,
        totalCommission: summary.totalCommission
      };
    } catch (error) {
      console.error('❌ Error getting summary statistics:', error);
      return {
        totalSales: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalCashback: 0,
        totalCommission: 0
      };
    }
  }

  async disconnect() {
    try {
      await database.disconnect();
      console.log('✅ Disconnected from database');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
    }
  }
}

// Main execution function
async function main() {
  const display = new UserSalesDataDisplay();
  
  try {
    await display.connect();
    await display.displayUserSalesData();
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  } finally {
    await display.disconnect();
    process.exit(0);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = UserSalesDataDisplay;