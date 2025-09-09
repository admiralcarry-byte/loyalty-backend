const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Billing Company Invoice seeder - Creates sample billing company invoices
 */
class BillingCompanyInvoiceSeeder extends BaseSeeder {
  async seed() {
    console.log('🧾 Seeding billing company invoices...');
    
    const existingCount = await this.getExistingCount('billingcompanyinvoice');
    if (existingCount > 0) {
      console.log(`ℹ️  Billing company invoices collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const billingCompanyInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoice_number: 'INV-2024-001',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31')
        },
        invoice_date: new Date('2024-02-01'),
        due_date: new Date('2024-02-15'),
        subtotal: 5000.00,
        tax_amount: 750.00,
        total_amount: 5750.00,
        currency: 'USD',
        status: 'paid',
        payment_date: new Date('2024-02-10'),
        payment_method: 'bank_transfer',
        payment_reference: 'PAY-2024-001',
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1000,
            unit_price: 2.50,
            total: 2500.00
          },
          {
            description: 'Subscription Services',
            quantity: 50,
            unit_price: 25.00,
            total: 1250.00
          },
          {
            description: 'Delivery Services',
            quantity: 200,
            unit_price: 6.25,
            total: 1250.00
          }
        ],
        notes: 'Monthly billing for January 2024 services',
        created_at: new Date('2024-02-01'),
        updated_at: new Date('2024-02-10')
      },
      {
        invoiceId: 'INV-2024-002',
        invoice_number: 'INV-2024-002',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-02-29')
        },
        invoice_date: new Date('2024-03-01'),
        due_date: new Date('2024-03-15'),
        subtotal: 5500.00,
        tax_amount: 825.00,
        total_amount: 6325.00,
        currency: 'USD',
        status: 'pending',
        payment_date: null,
        payment_method: null,
        payment_reference: null,
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1100,
            unit_price: 2.50,
            total: 2750.00
          },
          {
            description: 'Subscription Services',
            quantity: 55,
            unit_price: 25.00,
            total: 1375.00
          },
          {
            description: 'Delivery Services',
            quantity: 220,
            unit_price: 6.25,
            total: 1375.00
          }
        ],
        notes: 'Monthly billing for February 2024 services',
        created_at: new Date('2024-03-01'),
        updated_at: new Date('2024-03-01')
      },
      {
        invoiceId: 'INV-2024-003',
        invoice_number: 'INV-2024-003',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-03-01'),
          end_date: new Date('2024-03-31')
        },
        invoice_date: new Date('2024-04-01'),
        due_date: new Date('2024-04-15'),
        subtotal: 6000.00,
        tax_amount: 900.00,
        total_amount: 6900.00,
        currency: 'USD',
        status: 'overdue',
        payment_date: null,
        payment_method: null,
        payment_reference: null,
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1200,
            unit_price: 2.50,
            total: 3000.00
          },
          {
            description: 'Subscription Services',
            quantity: 60,
            unit_price: 25.00,
            total: 1500.00
          },
          {
            description: 'Delivery Services',
            quantity: 240,
            unit_price: 6.25,
            total: 1500.00
          }
        ],
        notes: 'Monthly billing for March 2024 services',
        created_at: new Date('2024-04-01'),
        updated_at: new Date('2024-04-01')
      },
      {
        invoiceId: 'INV-2024-004',
        invoice_number: 'INV-2024-004',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-04-01'),
          end_date: new Date('2024-04-30')
        },
        invoice_date: new Date('2024-05-01'),
        due_date: new Date('2024-05-15'),
        subtotal: 4500.00,
        tax_amount: 675.00,
        total_amount: 5175.00,
        currency: 'USD',
        status: 'draft',
        payment_date: null,
        payment_method: null,
        payment_reference: null,
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 900,
            unit_price: 2.50,
            total: 2250.00
          },
          {
            description: 'Subscription Services',
            quantity: 45,
            unit_price: 25.00,
            total: 1125.00
          },
          {
            description: 'Delivery Services',
            quantity: 180,
            unit_price: 6.25,
            total: 1125.00
          }
        ],
        notes: 'Monthly billing for April 2024 services',
        created_at: new Date('2024-05-01'),
        updated_at: new Date('2024-05-01')
      },
      {
        invoiceId: 'INV-2024-005',
        invoice_number: 'INV-2024-005',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-05-01'),
          end_date: new Date('2024-05-31')
        },
        invoice_date: new Date('2024-06-01'),
        due_date: new Date('2024-06-15'),
        subtotal: 7000.00,
        tax_amount: 1050.00,
        total_amount: 8050.00,
        currency: 'USD',
        status: 'paid',
        payment_date: new Date('2024-06-05'),
        payment_method: 'credit_card',
        payment_reference: 'CC-2024-005',
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1400,
            unit_price: 2.50,
            total: 3500.00
          },
          {
            description: 'Subscription Services',
            quantity: 70,
            unit_price: 25.00,
            total: 1750.00
          },
          {
            description: 'Delivery Services',
            quantity: 280,
            unit_price: 6.25,
            total: 1750.00
          }
        ],
        notes: 'Monthly billing for May 2024 services',
        created_at: new Date('2024-06-01'),
        updated_at: new Date('2024-06-05')
      },
      {
        invoiceId: 'INV-2024-006',
        invoice_number: 'INV-2024-006',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-06-01'),
          end_date: new Date('2024-06-30')
        },
        invoice_date: new Date('2024-07-01'),
        due_date: new Date('2024-07-15'),
        subtotal: 7500.00,
        tax_amount: 1125.00,
        total_amount: 8625.00,
        currency: 'USD',
        status: 'pending',
        payment_date: null,
        payment_method: null,
        payment_reference: null,
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1500,
            unit_price: 2.50,
            total: 3750.00
          },
          {
            description: 'Subscription Services',
            quantity: 75,
            unit_price: 25.00,
            total: 1875.00
          },
          {
            description: 'Delivery Services',
            quantity: 300,
            unit_price: 6.25,
            total: 1875.00
          }
        ],
        notes: 'Monthly billing for June 2024 services',
        created_at: new Date('2024-07-01'),
        updated_at: new Date('2024-07-01')
      },
      {
        invoiceId: 'INV-2024-007',
        invoice_number: 'INV-2024-007',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-07-01'),
          end_date: new Date('2024-07-31')
        },
        invoice_date: new Date('2024-08-01'),
        due_date: new Date('2024-08-15'),
        subtotal: 8000.00,
        tax_amount: 1200.00,
        total_amount: 9200.00,
        currency: 'USD',
        status: 'paid',
        payment_date: new Date('2024-08-08'),
        payment_method: 'bank_transfer',
        payment_reference: 'BT-2024-007',
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1600,
            unit_price: 2.50,
            total: 4000.00
          },
          {
            description: 'Subscription Services',
            quantity: 80,
            unit_price: 25.00,
            total: 2000.00
          },
          {
            description: 'Delivery Services',
            quantity: 320,
            unit_price: 6.25,
            total: 2000.00
          }
        ],
        notes: 'Monthly billing for July 2024 services',
        created_at: new Date('2024-08-01'),
        updated_at: new Date('2024-08-08')
      },
      {
        invoiceId: 'INV-2024-008',
        invoice_number: 'INV-2024-008',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-08-01'),
          end_date: new Date('2024-08-31')
        },
        invoice_date: new Date('2024-09-01'),
        due_date: new Date('2024-09-15'),
        subtotal: 8500.00,
        tax_amount: 1275.00,
        total_amount: 9775.00,
        currency: 'USD',
        status: 'pending',
        payment_date: null,
        payment_method: null,
        payment_reference: null,
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1700,
            unit_price: 2.50,
            total: 4250.00
          },
          {
            description: 'Subscription Services',
            quantity: 85,
            unit_price: 25.00,
            total: 2125.00
          },
          {
            description: 'Delivery Services',
            quantity: 340,
            unit_price: 6.25,
            total: 2125.00
          }
        ],
        notes: 'Monthly billing for August 2024 services',
        created_at: new Date('2024-09-01'),
        updated_at: new Date('2024-09-01')
      },
      {
        invoiceId: 'INV-2024-009',
        invoice_number: 'INV-2024-009',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-09-01'),
          end_date: new Date('2024-09-30')
        },
        invoice_date: new Date('2024-10-01'),
        due_date: new Date('2024-10-15'),
        subtotal: 9000.00,
        tax_amount: 1350.00,
        total_amount: 10350.00,
        currency: 'USD',
        status: 'paid',
        payment_date: new Date('2024-10-12'),
        payment_method: 'mobile_money',
        payment_reference: 'MM-2024-009',
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1800,
            unit_price: 2.50,
            total: 4500.00
          },
          {
            description: 'Subscription Services',
            quantity: 90,
            unit_price: 25.00,
            total: 2250.00
          },
          {
            description: 'Delivery Services',
            quantity: 360,
            unit_price: 6.25,
            total: 2250.00
          }
        ],
        notes: 'Monthly billing for September 2024 services',
        created_at: new Date('2024-10-01'),
        updated_at: new Date('2024-10-12')
      },
      {
        invoiceId: 'INV-2024-010',
        invoice_number: 'INV-2024-010',
        company_name: 'ÁGUA TWEZAH Ltd',
        company_address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        billing_period: {
          start_date: new Date('2024-10-01'),
          end_date: new Date('2024-10-31')
        },
        invoice_date: new Date('2024-11-01'),
        due_date: new Date('2024-11-15'),
        subtotal: 9500.00,
        tax_amount: 1425.00,
        total_amount: 10925.00,
        currency: 'USD',
        status: 'draft',
        payment_date: null,
        payment_method: null,
        payment_reference: null,
        items: [
          {
            description: 'Water Bottle Sales Commission',
            quantity: 1900,
            unit_price: 2.50,
            total: 4750.00
          },
          {
            description: 'Subscription Services',
            quantity: 95,
            unit_price: 25.00,
            total: 2375.00
          },
          {
            description: 'Delivery Services',
            quantity: 380,
            unit_price: 6.25,
            total: 2375.00
          }
        ],
        notes: 'Monthly billing for October 2024 services',
        created_at: new Date('2024-11-01'),
        updated_at: new Date('2024-11-01')
      }
    ];

    await this.seedCollection('billingcompanyinvoice', billingCompanyInvoices, { clearFirst: false });
  }
}

module.exports = BillingCompanyInvoiceSeeder;