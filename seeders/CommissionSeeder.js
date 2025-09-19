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
      console.log(`ℹ️  Commissions collection already has ${existingCount} records. Clearing first...`);
      await this.clearCollection('commissions');
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

    // Generate exactly 10 commissions
    for (let i = 0; i < 10; i++) {
      const randomInfluencer = influencerUsers[Math.floor(Math.random() * influencerUsers.length)];
      const randomSale = sales[Math.floor(Math.random() * sales.length)];
      
      const commissionRate = 0.10; // 10% commission
      const commissionAmount = randomSale.total_amount * commissionRate;
      
      const commission = {
        user: randomInfluencer._id,
        sale: randomSale._id,
        commission_number: `COMM${Date.now()}${i.toString().padStart(3, '0')}`,
        type: 'sale_commission',
        rate: commissionRate * 100, // Convert to percentage
        amount: commissionAmount,
        base_amount: randomSale.total_amount,
        currency: 'USD',
        status: ['pending', 'approved', 'paid'][Math.floor(Math.random() * 3)],
        calculation_details: {
          sale_amount: randomSale.total_amount,
          commission_rate: commissionRate * 100,
          tier_multiplier: 1,
          bonus_amount: 0,
          deductions: 0
        },
        payment_details: {
          payment_method: ['bank_transfer', 'mobile_money', 'cash'][Math.floor(Math.random() * 3)],
          payment_reference: `PAY${Date.now()}${i.toString().padStart(3, '0')}`,
          payment_date: Math.random() > 0.5 ? new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) : null
        },
        schedule: {
          due_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
          payment_date: Math.random() > 0.5 ? new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
          is_overdue: false
        },
        notes: `Commission for sale ${randomSale.transaction_id}`,
        metadata: {
          source: 'automatic',
          sale_channel: 'in_store'
        },
        createdAt: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updatedAt: new Date()
      };

      commissions.push(commission);
    }

    await this.seedCollection('commissions', commissions, { clearFirst: false });
  }
}

module.exports = CommissionSeeder;