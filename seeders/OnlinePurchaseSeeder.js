const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Online Purchase seeder - Creates sample online purchases
 */
class OnlinePurchaseSeeder extends BaseSeeder {
  async seed() {
    console.log('🛍️ Seeding online purchases...');
    
    const existingCount = await this.getExistingCount('onlinepurchases');
    if (existingCount > 0) {
      console.log(`ℹ️  Online purchases collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user and product IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    if (users.length === 0 || products.length === 0) {
      console.log('⚠️  Skipping online purchases seeding - required collections (users, products) are empty');
      return;
    }

    const onlinePurchases = [];

    // Generate online purchases
    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      const quantity = Math.floor(Math.random() * 5) + 1;
      const unitPrice = randomProduct.price;
      const subtotal = quantity * unitPrice;
      const shipping = Math.random() > 0.5 ? 5.0 : 0; // 50% chance of shipping
      const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0;
      const tax = (subtotal - discount + shipping) * 0.15;
      const total = subtotal - discount + shipping + tax;
      
      const onlinePurchase = {
        user_id: randomUser._id,
        order_number: `ON${Date.now()}${i.toString().padStart(3, '0')}`,
        order_id: `ON${Date.now()}${i.toString().padStart(3, '0')}`,
        product_id: randomProduct._id,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        shipping_cost: shipping,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: total,
        currency: 'USD',
        payment_method: ['credit_card', 'debit_card', 'mobile_money', 'bank_transfer'][Math.floor(Math.random() * 4)],
        payment_status: ['pending', 'completed', 'failed', 'refunded'][Math.floor(Math.random() * 4)],
        order_status: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 6)],
        shipping_address: {
          street: randomUser.address?.street || 'Rua da Independência, 123',
          city: randomUser.address?.city || 'Luanda',
          state: randomUser.address?.state || 'Luanda',
          postal_code: randomUser.address?.postal_code || '1000',
          country: randomUser.address?.country || 'Angola'
        },
        billing_address: {
          street: randomUser.address?.street || 'Rua da Independência, 123',
          city: randomUser.address?.city || 'Luanda',
          state: randomUser.address?.state || 'Luanda',
          postal_code: randomUser.address?.postal_code || '1000',
          country: randomUser.address?.country || 'Angola'
        },
        delivery_instructions: Math.random() > 0.7 ? 'Leave at front door if no answer' : null,
        estimated_delivery: new Date(Date.now() + (Math.random() * 7 * 24 * 60 * 60 * 1000)), // Within 7 days
        actual_delivery: Math.random() > 0.6 ? new Date(Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000)) : null,
        tracking_number: Math.random() > 0.5 ? `TRK${Date.now()}${i}` : null,
        notes: `Online purchase of ${quantity} ${randomProduct.name}`,
        metadata: {
          browser: 'Chrome',
          device: 'desktop',
          referrer: 'google.com',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'summer_sale'
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      onlinePurchases.push(onlinePurchase);
    }

    await this.seedCollection('onlinepurchases', onlinePurchases, { clearFirst: false });
  }
}

module.exports = OnlinePurchaseSeeder;