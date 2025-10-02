const mongoose = require('mongoose');
const { User, Sale } = require('../models');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function recalculateUserTotals() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const userModel = new User();
    const saleModel = new Sale();

    // Get all users
    const users = await userModel.findAll();
    console.log(`\n📊 Found ${users.length} users to process\n`);

    for (const user of users) {
      // Get all completed sales for this user
      const userSales = await saleModel.model.find({
        user_id: user._id,
        $or: [
          { status: 'completed' },
          { order_status: 'completed' }
        ]
      });

      // Calculate totals
      const totalLiters = userSales.reduce((sum, sale) => {
        return sum + (sale.quantity || sale.liters_purchased || 0);
      }, 0);

      const totalPurchases = userSales.reduce((sum, sale) => {
        return sum + (sale.total_amount || 0);
      }, 0);

      // Update user
      if (totalLiters > 0 || totalPurchases > 0) {
        await userModel.updateById(user._id, {
          total_liters: totalLiters,
          total_purchases: totalPurchases
        });

        console.log(`✅ ${user.first_name} ${user.last_name || ''} (${user.email})`);
        console.log(`   Total Liters: ${totalLiters}L`);
        console.log(`   Total Purchases: $${totalPurchases.toFixed(2)}`);
        console.log(`   Sales Count: ${userSales.length}\n`);
      }
    }

    console.log('✅ All user totals recalculated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error recalculating user totals:', error);
    process.exit(1);
  }
}

recalculateUserTotals();
