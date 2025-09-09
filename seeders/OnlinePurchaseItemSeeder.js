const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Online Purchase Item seeder - Creates sample online purchase items
 */
class OnlinePurchaseItemSeeder extends BaseSeeder {
  async seed() {
    console.log('📦 Seeding online purchase items...');
    
    const existingCount = await this.getExistingCount('onlinepurchaseitems');
    if (existingCount > 0) {
      console.log(`ℹ️  Online purchase items collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get online purchase and product IDs for relationships
    const onlinePurchases = await mongoose.connection.db.collection('onlinepurchases').find({}).toArray();
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    if (onlinePurchases.length === 0 || products.length === 0) {
      console.log('⚠️  Skipping online purchase items seeding - required collections (online_purchases, products) are empty');
      return;
    }

    const onlinePurchaseItems = [];

    // Generate online purchase items
    for (let i = 0; i < 10; i++) {
      const randomPurchase = onlinePurchases[Math.floor(Math.random() * onlinePurchases.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = randomProduct.price;
      const subtotal = quantity * unitPrice;
      
      const onlinePurchaseItem = {
        online_purchase_id: randomPurchase._id,
        product_id: randomProduct._id,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount_amount: Math.random() > 0.8 ? subtotal * 0.05 : 0, // 20% chance of 5% discount
        tax_amount: (subtotal - (Math.random() > 0.8 ? subtotal * 0.05 : 0)) * 0.15,
        total_amount: subtotal - (Math.random() > 0.8 ? subtotal * 0.05 : 0) + ((subtotal - (Math.random() > 0.8 ? subtotal * 0.05 : 0)) * 0.15),
        currency: 'USD',
        notes: `Item: ${randomProduct.name}`,
        metadata: {
          product_sku: randomProduct.sku,
          product_category: randomProduct.category,
          weight: randomProduct.weight * quantity,
          dimensions: randomProduct.dimensions
        },
        created_at: randomPurchase.created_at,
        updated_at: new Date()
      };

      onlinePurchaseItems.push(onlinePurchaseItem);
    }

    await this.seedCollection('onlinepurchaseitems', onlinePurchaseItems, { clearFirst: false });
  }
}

module.exports = OnlinePurchaseItemSeeder;