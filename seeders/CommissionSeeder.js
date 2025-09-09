const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Commission seeder - Creates sample commissions
 */
class CommissionSeeder extends BaseSeeder {
  async seed() {
    console.log('💰 Seeding commissions...');
    
    const existingCount = await this.getExistingCount('commissions');
    if (existingCount > 0) {
      console.log(`ℹ️  Commissions collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user and sale IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const sales = await mongoose.connection.db.collection('sales').find({}).toArray();
    
    if (users.length === 0 || sales.length === 0) {
      console.log('⚠️  Skipping commissions seeding - required collections (users, sales) are empty');
      return;
    }

    const influencerUsers = users.filter(u => u.role === 'influencer');
    const commissions = [];

    // Generate commissions for influencer sales
    for (let i = 0; i < 10; i++) {
      const randomInfluencer = influencerUsers[Math.floor(Math.random() * influencerUsers.length)];
      const randomSale = sales[Math.floor(Math.random() * sales.length)];
      
      const commissionRate = 0.10; // 10% commission
      const commissionAmount = randomSale.total_amount * commissionRate;
      
      const commission = {
        user_id: randomInfluencer._id,
        sale_id: randomSale._id,
        commission_number: `COMM${Date.now()}${i.toString().padStart(3, '0')}`,
        commission_type: 'sale_referral',
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        base_amount: randomSale.total_amount,
        currency: 'USD',
        status: ['pending', 'approved', 'paid'][Math.floor(Math.random() * 3)],
        payment_method: ['bank_transfer', 'mobile_money', 'cash'][Math.floor(Math.random() * 3)],
        payment_reference: `PAY${Date.now()}${i.toString().padStart(3, '0')}`,
        payment_date: Math.random() > 0.5 ? new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
        notes: `Commission for sale ${randomSale.transaction_id}`,
        metadata: {
          sale_date: randomSale.created_at || new Date(),
          customer_id: randomSale.user_id,
          product_quantity: randomSale.quantity,
          loyalty_tier: randomSale.loyalty_tier_at_purchase
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      commissions.push(commission);
    }

    await this.seedCollection('commissions', commissions, { clearFirst: false });
  }
}

module.exports = CommissionSeeder;