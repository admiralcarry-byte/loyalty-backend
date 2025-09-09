const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Payout Request seeder - Creates sample payout requests
 */
class PayoutRequestSeeder extends BaseSeeder {
  async seed() {
    console.log('💸 Seeding payout requests...');
    
    const existingCount = await this.getExistingCount('payoutrequests');
    if (existingCount > 0) {
      console.log(`ℹ️  Payout requests collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping payout requests seeding - users collection is empty');
      return;
    }

    const influencerUsers = users.filter(u => u.role === 'influencer');
    const payoutRequests = [];

    // Generate payout requests
    for (let i = 0; i < 10; i++) {
      const randomUser = influencerUsers[Math.floor(Math.random() * influencerUsers.length)];
      
      const amount = Math.floor(Math.random() * 500) + 50; // $50 to $550
      const fee = amount * 0.02; // 2% fee
      const netAmount = amount - fee;
      
      const payoutRequest = {
        user: randomUser._id,
        request_number: `PR${Date.now()}${i.toString().padStart(3, '0')}`,
        amount: amount,
        currency: 'USD',
        status: ['pending', 'approved', 'rejected', 'paid', 'cancelled'][Math.floor(Math.random() * 5)],
        bank_details: {
          account_name: randomUser.first_name + ' ' + randomUser.last_name,
          account_number: '1234567890123456',
          bank_name: 'Banco de Fomento Angola',
          branch_code: '001',
          bic: 'BFAOAOLU'
        },
        commission_breakdown: {
          total_commission_earned: amount,
          previously_paid: Math.floor(amount * 0.3),
          pending_payout: Math.floor(amount * 0.7)
        },
        approval: {
          requested_date: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
          approved_date: Math.random() > 0.5 ? new Date(Date.now() - (Math.random() * 15 * 24 * 60 * 60 * 1000)) : undefined,
          notes: `Payout request for commission earnings`
        },
        payment: Math.random() > 0.5 ? {
          payment_method: ['bank_transfer', 'mobile_money', 'cash', 'check'][Math.floor(Math.random() * 4)],
          payment_reference: `PAY${Date.now()}${i}`,
          payment_date: new Date(Date.now() - (Math.random() * 10 * 24 * 60 * 60 * 1000)),
          transaction_id: `TXN${Date.now()}${i}`
        } : undefined,
        related_commissions: [],
        metadata: {
          source: ['manual', 'automatic', 'system_generated'][Math.floor(Math.random() * 3)],
          period_start: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
          period_end: new Date(),
          commission_type: ['monthly', 'weekly', 'quarterly', 'on_demand'][Math.floor(Math.random() * 4)]
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      payoutRequests.push(payoutRequest);
    }

    await this.seedCollection('payoutrequests', payoutRequests, { clearFirst: true });
  }
}

module.exports = PayoutRequestSeeder;