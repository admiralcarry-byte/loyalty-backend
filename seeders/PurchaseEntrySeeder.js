const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Purchase Entry seeder - Creates sample purchase entries
 */
class PurchaseEntrySeeder extends BaseSeeder {
  async seed() {
    console.log('🛒 Seeding purchase entries...');
    
    const existingCount = await this.getExistingCount('purchaseentries');
    if (existingCount > 0) {
      console.log(`ℹ️  Purchase entries collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user, store, and product IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const stores = await mongoose.connection.db.collection('stores').find({}).toArray();
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    if (users.length === 0 || stores.length === 0 || products.length === 0) {
      console.log('⚠️  Skipping purchase entries seeding - required collections (users, stores, products) are empty');
      return;
    }

    const purchaseEntries = [];

    // Generate purchase entries
    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = randomProduct.price;
      const subtotal = quantity * unitPrice;
      const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0;
      const tax = (subtotal - discount) * 0.15;
      const total = subtotal - discount + tax;
      
      const purchaseEntry = {
        user_id: randomUser._id,
        store_id: randomStore._id,
        product_id: randomProduct._id,
        entry_number: `PE${Date.now()}${i.toString().padStart(3, '0')}`,
        entry_id: `PE${Date.now()}${i.toString().padStart(3, '0')}`,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: total,
        currency: 'USD',
        payment_method: ['cash', 'mobile_money', 'bank_transfer', 'credit_card'][Math.floor(Math.random() * 4)],
        payment_status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)],
        entry_status: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'][Math.floor(Math.random() * 5)],
        entry_type: ['manual', 'scan', 'online'][Math.floor(Math.random() * 3)],
        receipt_image: Math.random() > 0.5 ? `receipt-${Date.now()}-${i}.jpg` : null,
        notes: `Purchase entry for ${quantity} ${randomProduct.name}`,
        metadata: {
          entry_source: 'admin_panel',
          staff_id: randomUser._id,
          customer_notes: Math.random() > 0.8 ? 'Special delivery instructions' : null,
          delivery_address: randomUser.address
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      purchaseEntries.push(purchaseEntry);
    }

    await this.seedCollection('purchaseentries', purchaseEntries, { clearFirst: false });
  }
}

module.exports = PurchaseEntrySeeder;