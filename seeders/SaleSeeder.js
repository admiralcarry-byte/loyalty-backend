const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

// Import compiled models
const Sale = require('../schemas/Sale');
const User = require('../schemas/User');
const Store = require('../schemas/Store');

class SaleSeeder extends BaseSeeder {
  constructor() {
    super('Sale');
  }

  async run() {
    try {
      console.log('🌱 Starting Sale seeding...');

      // Ensure connection
      await this.connect();

      // Get existing users and stores for references
      const users = await User.find().limit(10);
      const stores = await Store.find().limit(5);

      if (users.length === 0) {
        console.log('⚠️  No users found. Please run UserSeeder first.');
        return;
      }

      if (stores.length === 0) {
        console.log('⚠️  No stores found. Please run StoreSeeder first.');
        return;
      }

      // Sample invoice data for water sales
      const sampleInvoices = [
        {
          purchaser_name: 'Kevin Customer',
          purchaser_phone: '8990989899',
          purchaser_email: 'kevin@example.com',
          liters_purchased: 20,
          total_amount: 180.00,
          store_number: 'ST001',
          store_number_hash: Buffer.from('ST001').toString('base64'),
          qr_code_data: Buffer.from('ST001').toString('base64'),
          payment_method: 'cash',
          status: 'completed'
        },
        {
          purchaser_name: 'João Silva',
          purchaser_phone: '+55 11 99999-1111',
          purchaser_email: 'joao.silva@email.com',
          liters_purchased: 20,
          total_amount: 45.00,
          store_number: 'ST001',
          store_number_hash: Buffer.from('ST001').toString('base64'),
          qr_code_data: Buffer.from('ST001').toString('base64'),
          payment_method: 'pix',
          status: 'completed'
        },
        {
          purchaser_name: 'Maria Santos',
          purchaser_phone: '+55 11 99999-2222',
          purchaser_email: 'maria.santos@email.com',
          liters_purchased: 15,
          total_amount: 33.75,
          store_number: 'ST002',
          store_number_hash: Buffer.from('ST002').toString('base64'),
          qr_code_data: Buffer.from('ST002').toString('base64'),
          payment_method: 'cash',
          status: 'completed'
        },
        {
          purchaser_name: 'Pedro Oliveira',
          purchaser_phone: '+55 11 99999-3333',
          purchaser_email: 'pedro.oliveira@email.com',
          liters_purchased: 30,
          total_amount: 67.50,
          store_number: 'ST001',
          store_number_hash: Buffer.from('ST001').toString('base64'),
          qr_code_data: Buffer.from('ST001').toString('base64'),
          payment_method: 'card',
          status: 'completed'
        },
        {
          purchaser_name: 'Ana Costa',
          purchaser_phone: '+55 11 99999-4444',
          purchaser_email: 'ana.costa@email.com',
          liters_purchased: 25,
          total_amount: 56.25,
          store_number: 'ST003',
          store_number_hash: Buffer.from('ST003').toString('base64'),
          qr_code_data: Buffer.from('ST003').toString('base64'),
          payment_method: 'pix',
          status: 'completed'
        },
        {
          purchaser_name: 'Carlos Ferreira',
          purchaser_phone: '+55 11 99999-5555',
          purchaser_email: 'carlos.ferreira@email.com',
          liters_purchased: 12,
          total_amount: 27.00,
          store_number: 'ST002',
          store_number_hash: Buffer.from('ST002').toString('base64'),
          qr_code_data: Buffer.from('ST002').toString('base64'),
          payment_method: 'cash',
          status: 'completed'
        },
        {
          purchaser_name: 'Lucia Rodrigues',
          purchaser_phone: '+55 11 99999-6666',
          purchaser_email: 'lucia.rodrigues@email.com',
          liters_purchased: 18,
          total_amount: 40.50,
          store_number: 'ST001',
          store_number_hash: Buffer.from('ST001').toString('base64'),
          qr_code_data: Buffer.from('ST001').toString('base64'),
          payment_method: 'bank_transfer',
          status: 'completed'
        },
        {
          purchaser_name: 'Roberto Alves',
          purchaser_phone: '+55 11 99999-7777',
          purchaser_email: 'roberto.alves@email.com',
          liters_purchased: 35,
          total_amount: 78.75,
          store_number: 'ST004',
          store_number_hash: Buffer.from('ST004').toString('base64'),
          qr_code_data: Buffer.from('ST004').toString('base64'),
          payment_method: 'pix',
          status: 'completed'
        },
        {
          purchaser_name: 'Fernanda Lima',
          purchaser_phone: '+55 11 99999-8888',
          purchaser_email: 'fernanda.lima@email.com',
          liters_purchased: 22,
          total_amount: 49.50,
          store_number: 'ST003',
          store_number_hash: Buffer.from('ST003').toString('base64'),
          qr_code_data: Buffer.from('ST003').toString('base64'),
          payment_method: 'card',
          status: 'completed'
        },
        {
          purchaser_name: 'Marcos Pereira',
          purchaser_phone: '+55 11 99999-9999',
          purchaser_email: 'marcos.pereira@email.com',
          liters_purchased: 28,
          total_amount: 63.00,
          store_number: 'ST002',
          store_number_hash: Buffer.from('ST002').toString('base64'),
          qr_code_data: Buffer.from('ST002').toString('base64'),
          payment_method: 'wallet',
          status: 'completed'
        },
        {
          purchaser_name: 'Patricia Souza',
          purchaser_phone: '+55 11 99999-0000',
          purchaser_email: 'patricia.souza@email.com',
          liters_purchased: 16,
          total_amount: 36.00,
          store_number: 'ST005',
          store_number_hash: Buffer.from('ST005').toString('base64'),
          qr_code_data: Buffer.from('ST005').toString('base64'),
          payment_method: 'pix',
          status: 'completed'
        }
      ];

      const sales = [];
      const now = new Date();

      // Find Kevin user specifically
      const kevinUser = users.find(user => user.first_name === 'Kevin');
      
      for (let i = 0; i < sampleInvoices.length; i++) {
        const invoice = sampleInvoices[i];
        // Use Kevin for the first invoice (Kevin's sale), random for others
        const selectedUser = i === 0 && kevinUser ? kevinUser : users[Math.floor(Math.random() * users.length)];
        const randomStore = stores[Math.floor(Math.random() * stores.length)];
        // Create a simple product reference for water sales
        const randomProduct = {
          _id: new mongoose.Types.ObjectId(),
          name: 'ÁGUA TWEZAH Premium',
          sku: 'AT-PREMIUM-500',
          price: { current: 2.25 }
        };
      
        const saleData = {
          // Required fields
          user_id: selectedUser._id,
          customer: selectedUser._id,
          quantity: invoice.liters_purchased,
          total_amount: invoice.total_amount,
          currency: 'BRL',
          order_status: 'completed',
          status: 'completed',
          payment_method: invoice.payment_method,
          
          // Invoice-specific fields
          purchaser_name: invoice.purchaser_name,
          purchaser_phone: invoice.purchaser_phone,
          purchaser_email: invoice.purchaser_email,
          liters_purchased: invoice.liters_purchased,
          store_number: invoice.store_number,
          store_number_hash: invoice.store_number_hash,
          qr_code_data: invoice.qr_code_data,
          
          // Optional fields with defaults
          unit_price: invoice.total_amount / invoice.liters_purchased,
          subtotal: invoice.total_amount,
          discount_amount: 0,
          tax_amount: 0,
          points_earned: Math.floor(invoice.total_amount * 0.1), // 10% points
          cashback_earned: Math.floor(invoice.total_amount * 0.05), // 5% cashback
          loyalty_tier_at_purchase: 'lead',
          
          // References (optional)
        store_id: randomStore._id,
        product_id: randomProduct._id,
          customer: selectedUser._id,
          
          // Timestamps
          created_at: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)), // Spread over last 10 days
          updated_at: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)),
          
          // Additional fields
          notes: `Invoice generated for ${invoice.liters_purchased}L water purchase at ${invoice.store_number}`
        };

        sales.push(saleData);
      }

      // Clear existing sales
      await Sale.deleteMany({});
      console.log('🗑️  Cleared existing sales');

      // Insert new sales
      const createdSales = await Sale.insertMany(sales);
      console.log(`✅ Created ${createdSales.length} sales with invoice data`);

      // Log sample data
      console.log('\n📊 Sample Sale Data:');
      createdSales.slice(0, 3).forEach((sale, index) => {
        console.log(`${index + 1}. ${sale.purchaser_name} - ${sale.liters_purchased}L - R$ ${sale.total_amount} - ${sale.store_number}`);
      });

      return createdSales;

    } catch (error) {
      console.error('❌ Error seeding sales:', error);
      throw error;
    }
  }
}

module.exports = SaleSeeder;