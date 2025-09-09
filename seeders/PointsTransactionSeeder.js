const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Points Transaction seeder - Creates sample points transactions
 */
class PointsTransactionSeeder extends BaseSeeder {
  async seed() {
    console.log('⭐ Seeding points transactions...');
    
    const existingCount = await this.getExistingCount('pointstransactions');
    if (existingCount > 0) {
      console.log(`ℹ️  Points transactions collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const sales = await mongoose.connection.db.collection('sales').find({}).toArray();

    if (users.length === 0) {
      console.log('⚠️  Skipping points transactions seeding - users collection is empty');
      return;
    }

    const pointsTransactions = [];
    const customerUsers = users.filter(u => u.role === 'customer');
    const transactionTypes = ['earned', 'spent', 'bonus', 'referral', 'expired'];

    // Generate exactly 10 points transactions
    for (let i = 0; i < 10; i++) {
      const randomUser = customerUsers[Math.floor(Math.random() * customerUsers.length)];
      const randomSale = sales[Math.floor(Math.random() * sales.length)];
      const transactionType = transactionTypes[i % transactionTypes.length];
      
      let amount, description, source, sourceType, expiresAt, metadata;
      
      switch (transactionType) {
        case 'earned':
          amount = Math.floor(Math.random() * 200) + 50; // 50-250 points
          description = `Points earned from purchase`;
          source = 'purchase';
          sourceType = 'sale';
          expiresAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));
          metadata = {
            sale_transaction_id: randomSale?.transaction_id || `TXN${i}`,
            loyalty_tier: randomUser.loyalty_tier,
            points_per_dollar: 0.1
          };
          break;
        case 'spent':
          amount = -(Math.floor(Math.random() * 100) + 25); // -25 to -125 points
          description = `Points redeemed for discount`;
          source = 'redemption';
          sourceType = 'redemption';
          expiresAt = null;
          metadata = {
            redemption_type: 'discount',
            discount_amount: Math.abs(amount) * 0.01,
            loyalty_tier: randomUser.loyalty_tier
          };
          break;
        case 'bonus':
          amount = Math.floor(Math.random() * 150) + 25; // 25-175 points
          description = `Bonus points from loyalty program`;
          source = 'campaign';
          sourceType = 'campaign';
          expiresAt = new Date(Date.now() + (180 * 24 * 60 * 60 * 1000));
          metadata = {
            campaign_name: 'Loyalty Bonus',
            bonus_reason: 'tier_upgrade',
            loyalty_tier: randomUser.loyalty_tier
          };
          break;
        case 'referral':
          amount = Math.floor(Math.random() * 100) + 50; // 50-150 points
          description = `Points earned from referral`;
          source = 'referral';
          sourceType = 'referral';
          expiresAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));
          metadata = {
            referred_user_id: 'referral_user_id_placeholder',
            referral_code: randomUser.referral_code,
            loyalty_tier: randomUser.loyalty_tier
          };
          break;
        case 'expired':
          amount = -(Math.floor(Math.random() * 75) + 25); // -25 to -100 points
          description = `Points expired after 1 year`;
          source = 'expiration';
          sourceType = 'expiration';
          expiresAt = null;
          metadata = {
            original_earned_date: new Date(Date.now() - (400 * 24 * 60 * 60 * 1000)),
            loyalty_tier: randomUser.loyalty_tier
          };
          break;
      }
      
      const pointsTransaction = {
        user_id: randomUser._id,
        transaction_number: `PT${Date.now()}${i.toString().padStart(3, '0')}`,
        transaction_id: `PT${Date.now()}${i.toString().padStart(3, '0')}`,
        type: transactionType,
        amount: amount,
        balance_after: 0, // Will be calculated
        source: source,
        source_id: transactionType === 'earned' ? randomSale?._id : null,
        source_type: sourceType,
        description: description,
        status: 'completed',
        expires_at: expiresAt,
        metadata: metadata,
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };
      
      pointsTransactions.push(pointsTransaction);
    }

    await this.seedCollection('pointstransactions', pointsTransactions, { clearFirst: false });
  }
}

module.exports = PointsTransactionSeeder;