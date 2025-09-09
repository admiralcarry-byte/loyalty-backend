const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Cashback Transaction seeder - Creates sample cashback transactions
 */
class CashbackTransactionSeeder extends BaseSeeder {
  async seed() {
    console.log('💳 Seeding cashback transactions...');
    
    const existingCount = await this.getExistingCount('cashbacktransactions');
    if (existingCount > 0) {
      console.log(`ℹ️  Cashback transactions collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user and sale IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const sales = await mongoose.connection.db.collection('sales').find({}).toArray();
    
    if (users.length === 0 || sales.length === 0) {
      console.log('⚠️  Skipping cashback transactions seeding - required collections (users, sales) are empty');
      return;
    }

    const cashbackTransactions = [];

    // Generate cashback transactions for sales
    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomSale = sales[Math.floor(Math.random() * sales.length)];
      
      const cashbackPercentage = Math.random() > 0.5 ? 5 : 8; // 5% or 8%
      const cashbackAmount = randomSale.total_amount * (cashbackPercentage / 100);
      
      const cashbackTransaction = {
        user_id: randomUser._id,
        sale_id: randomSale._id,
        transaction_number: `CB${Date.now()}${i.toString().padStart(3, '0')}`,
        transaction_id: `CB${Date.now()}${i.toString().padStart(3, '0')}`,
        amount: cashbackAmount,
        percentage: cashbackPercentage,
        base_amount: randomSale.total_amount,
        currency: 'USD',
        status: ['pending', 'approved', 'paid'][Math.floor(Math.random() * 3)],
        payment_method: ['bank_transfer', 'mobile_money', 'wallet_credit'][Math.floor(Math.random() * 3)],
        payment_reference: `PAY${Date.now()}${i.toString().padStart(3, '0')}`,
        payment_date: Math.random() > 0.5 ? new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
        notes: `Cashback for purchase ${randomSale.transaction_id}`,
        metadata: {
          sale_date: randomSale.created_at || new Date(),
          customer_tier: randomUser.loyalty_tier,
          product_category: 'water',
          cashback_rule: 'standard_purchase'
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      cashbackTransactions.push(cashbackTransaction);
    }

    await this.seedCollection('cashbacktransactions', cashbackTransactions, { clearFirst: false });
  }
}

module.exports = CashbackTransactionSeeder;