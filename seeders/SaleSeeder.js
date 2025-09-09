const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Sale seeder - Creates sample sales transactions
 */
class SaleSeeder extends BaseSeeder {
  async seed() {
    console.log('💰 Seeding sales...');
    
    const existingCount = await this.getExistingCount('sales');
    if (existingCount > 0) {
      console.log(`ℹ️  Sales collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user and store IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const stores = await mongoose.connection.db.collection('stores').find({}).toArray();
    const products = await mongoose.connection.db.collection('products').find({}).toArray();

    if (users.length === 0 || stores.length === 0 || products.length === 0) {
      console.log('⚠️  Skipping sales seeding - required collections (users, stores, products) are empty');
      return;
    }

    const sales = [];
    const customerUsers = users.filter(u => u.role === 'customer');
    const influencerUsers = users.filter(u => u.role === 'influencer');

    // Generate sales for the last 90 days
    for (let i = 0; i < 10; i++) {
      const randomUser = customerUsers[Math.floor(Math.random() * customerUsers.length)];
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      // Random date within last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const saleDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = randomProduct.price;
      const subtotal = quantity * unitPrice;
      const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0; // 30% chance of 10% discount
      const tax = (subtotal - discount) * 0.15; // 15% tax
      const total = subtotal - discount + tax;
      
      const pointsEarned = Math.floor(total * 0.1); // 10% of total as points
      const cashbackEarned = total * (randomProduct.cashback_percentage / 100);

      const sale = {
        user_id: randomUser._id,
        store_id: randomStore._id,
        product_id: randomProduct._id,
        sale_number: `SALE${Date.now()}${i.toString().padStart(3, '0')}`,
        transaction_id: `TXN${Date.now()}${i.toString().padStart(3, '0')}`,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: total,
        currency: 'USD',
        payment_method: ['cash', 'mobile_money', 'bank_transfer', 'credit_card'][Math.floor(Math.random() * 4)],
        payment_status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        order_status: ['delivered', 'in_transit', 'processing', 'cancelled'][Math.floor(Math.random() * 4)],
        points_earned: pointsEarned,
        cashback_earned: cashbackEarned,
        loyalty_tier_at_purchase: randomUser.loyalty_tier,
        campaign_id: null, // Will be set if campaign applies
        referral_code: randomUser.referral_code,
        notes: `Sale of ${quantity} ${randomProduct.name}`,
        metadata: {
          original_price: unitPrice,
          discount_reason: discount > 0 ? 'promotional' : null,
          delivery_address: randomUser.address,
          customer_notes: Math.random() > 0.8 ? 'Special delivery instructions' : null
        }
      };

      // Add some sales with campaigns
      if (Math.random() > 0.8) {
        sale.campaign_id = 'campaign_id_placeholder'; // Would be actual campaign ID
        sale.metadata.campaign_applied = true;
      }

      sales.push(sale);
    }

    // Add some influencer sales
    for (let i = 0; i < 0; i++) {
      const randomUser = influencerUsers[Math.floor(Math.random() * influencerUsers.length)];
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      const daysAgo = Math.floor(Math.random() * 30);
      const saleDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const quantity = Math.floor(Math.random() * 5) + 1;
      const unitPrice = randomProduct.price;
      const subtotal = quantity * unitPrice;
      const discount = subtotal * 0.15; // Influencers get 15% discount
      const tax = (subtotal - discount) * 0.15;
      const total = subtotal - discount + tax;
      
      const pointsEarned = Math.floor(total * 0.15); // Influencers get 15% points
      const cashbackEarned = total * (randomProduct.cashback_percentage / 100);

      const sale = {
        user_id: randomUser._id,
        store_id: randomStore._id,
        product_id: randomProduct._id,
        sale_number: `SALE${Date.now()}${(150 + i).toString().padStart(3, '0')}`,
        transaction_id: `TXN${Date.now()}${(150 + i).toString().padStart(3, '0')}`,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: total,
        currency: 'USD',
        payment_method: ['mobile_money', 'bank_transfer', 'credit_card'][Math.floor(Math.random() * 3)],
        payment_status: 'completed',
        order_status: ['delivered', 'in_transit'][Math.floor(Math.random() * 2)],
        points_earned: pointsEarned,
        cashback_earned: cashbackEarned,
        loyalty_tier_at_purchase: randomUser.loyalty_tier,
        campaign_id: null,
        referral_code: randomUser.referral_code,
        notes: `Influencer sale of ${quantity} ${randomProduct.name}`,
        metadata: {
          original_price: unitPrice,
          discount_reason: 'influencer_discount',
          delivery_address: randomUser.address,
          influencer_commission: total * 0.1 // 10% commission
        }
      };

      sales.push(sale);
    }

    await this.seedCollection('sales', sales, { clearFirst: false });
  }
}

module.exports = SaleSeeder;