const mongoose = require('mongoose');
const BaseSeeder = require('./BaseSeeder');

class ScanUploadSeeder extends BaseSeeder {
  constructor() {
    super();
    this.collectionName = 'scanuploads';
  }

  async seed() {
    try {
      // Check if ScanUpload collection exists and has data
      const existingCount = await this.getExistingCount(this.collectionName);
      if (existingCount > 0) {
        console.log(`   ⚠️  ${this.collectionName} collection already has ${existingCount} documents. Skipping...`);
        return;
      }

      // Get some users and stores for references
      const users = await mongoose.model('User').find().limit(5);
      const stores = await mongoose.model('Store').find().limit(3);

      if (users.length === 0 || stores.length === 0) {
        console.log(`   ⚠️  No users or stores found. Skipping ${this.collectionName} seeding...`);
        return;
      }

      const sampleScanUploads = [
        {
          userId: users[0]._id,
          storeId: stores[0]._id,
          invoiceNumber: 'INV-2024-001',
          amount: 150.00,
          date: new Date('2024-01-15'),
          status: 'final',
          filePath: '/uploads/receipts/receipt-001.jpg',
          ocrExtractedText: 'INVOICE #INV-2024-001\nStore: ÁGUA TWEZAH Store 1\nCustomer: João Silva\nPhone: (11) 99999-9999\nEmail: joao@email.com\nLiters: 15\nAmount: R$ 150.00\nDate: 15/01/2024\nPayment: Credit Card',
          ocrData: {
            invoiceNumber: 'INV-2024-001',
            storeName: 'ÁGUA TWEZAH Store 1',
            amount: 150.00,
            currency: 'BRL',
            date: new Date('2024-01-15'),
            paymentMethod: 'credit_card',
            customerName: 'João Silva',
            liters: 15,
            phoneNumber: '(11) 99999-9999',
            email: 'joao@email.com',
            confidence: 0.95,
            extractionMethod: 'fast'
          },
          qrData: {
            receiptId: 'QR-2024-001',
            storeNumber: '1',
            amount: 150.00,
            date: new Date('2024-01-15'),
            verificationCode: 'V123456789',
            customerId: users[0]._id.toString(),
            transactionId: 'TXN-001',
            rawData: '{"receiptId":"QR-2024-001","storeNumber":"1","amount":150.00,"date":"2024-01-15T00:00:00.000Z","verificationCode":"V123456789","customerId":"' + users[0]._id.toString() + '","transactionId":"TXN-001"}',
            confidence: 1.0,
            extractionMethod: 'direct'
          },
          pointsAwarded: 15,
          cashbackAwarded: 7.50,
          processedBy: users[0]._id,
          processedAt: new Date('2024-01-15T10:30:00')
        },
        {
          userId: users[1] ? users[1]._id : users[0]._id,
          storeId: stores[1] ? stores[1]._id : stores[0]._id,
          invoiceNumber: 'INV-2024-002',
          amount: 200.00,
          date: new Date('2024-01-16'),
          status: 'provisional',
          filePath: '/uploads/receipts/receipt-002.jpg',
          ocrExtractedText: 'INVOICE #INV-2024-002\nStore: ÁGUA TWEZAH Store 2\nCustomer: Maria Santos\nPhone: (11) 88888-8888\nEmail: maria@email.com\nLiters: 20\nAmount: R$ 200.00\nDate: 16/01/2024\nPayment: Debit Card',
          ocrData: {
            invoiceNumber: 'INV-2024-002',
            storeName: 'ÁGUA TWEZAH Store 2',
            amount: 200.00,
            currency: 'BRL',
            date: new Date('2024-01-16'),
            paymentMethod: 'debit_card',
            customerName: 'Maria Santos',
            liters: 20,
            phoneNumber: '(11) 88888-8888',
            email: 'maria@email.com',
            confidence: 0.88,
            extractionMethod: 'fast'
          },
          qrData: {
            receiptId: 'QR-2024-002',
            storeNumber: '2',
            amount: 200.00,
            date: new Date('2024-01-16'),
            verificationCode: 'V987654321',
            customerId: users[1] ? users[1]._id.toString() : users[0]._id.toString(),
            transactionId: 'TXN-002',
            rawData: '{"receiptId":"QR-2024-002","storeNumber":"2","amount":200.00,"date":"2024-01-16T00:00:00.000Z","verificationCode":"V987654321","customerId":"' + (users[1] ? users[1]._id.toString() : users[0]._id.toString()) + '","transactionId":"TXN-002"}',
            confidence: 1.0,
            extractionMethod: 'direct'
          },
          pointsAwarded: 20,
          cashbackAwarded: 10.00
        },
        {
          userId: users[2] ? users[2]._id : users[0]._id,
          storeId: stores[2] ? stores[2]._id : stores[0]._id,
          invoiceNumber: 'INV-2024-003',
          amount: 75.50,
          date: new Date('2024-01-17'),
          status: 'final',
          filePath: '/uploads/receipts/receipt-003.jpg',
          ocrExtractedText: 'INVOICE #INV-2024-003\nStore: ÁGUA TWEZAH Store 3\nCustomer: Pedro Costa\nPhone: (11) 77777-7777\nEmail: pedro@email.com\nLiters: 7.5\nAmount: R$ 75.50\nDate: 17/01/2024\nPayment: Cash',
          ocrData: {
            invoiceNumber: 'INV-2024-003',
            storeName: 'ÁGUA TWEZAH Store 3',
            amount: 75.50,
            currency: 'BRL',
            date: new Date('2024-01-17'),
            paymentMethod: 'cash',
            customerName: 'Pedro Costa',
            liters: 7.5,
            phoneNumber: '(11) 77777-7777',
            email: 'pedro@email.com',
            confidence: 0.92,
            extractionMethod: 'fast'
          },
          qrData: {
            receiptId: 'QR-2024-003',
            storeNumber: '3',
            amount: 75.50,
            date: new Date('2024-01-17'),
            verificationCode: 'V456789123',
            customerId: users[2] ? users[2]._id.toString() : users[0]._id.toString(),
            transactionId: 'TXN-003',
            rawData: '{"receiptId":"QR-2024-003","storeNumber":"3","amount":75.50,"date":"2024-01-17T00:00:00.000Z","verificationCode":"V456789123","customerId":"' + (users[2] ? users[2]._id.toString() : users[0]._id.toString()) + '","transactionId":"TXN-003"}',
            confidence: 1.0,
            extractionMethod: 'direct'
          },
          pointsAwarded: 7,
          cashbackAwarded: 3.75,
          processedBy: users[0]._id,
          processedAt: new Date('2024-01-17T14:20:00')
        },
        {
          userId: users[3] ? users[3]._id : users[0]._id,
          storeId: stores[0]._id,
          invoiceNumber: 'INV-2024-004',
          amount: 300.00,
          date: new Date('2024-01-18'),
          status: 'rejected',
          filePath: '/uploads/receipts/receipt-004.jpg',
          ocrExtractedText: 'INVOICE #INV-2024-004\nStore: ÁGUA TWEZAH Store 1\nCustomer: Ana Oliveira\nPhone: (11) 66666-6666\nEmail: ana@email.com\nLiters: 30\nAmount: R$ 300.00\nDate: 18/01/2024\nPayment: PIX',
          ocrData: {
            invoiceNumber: 'INV-2024-004',
            storeName: 'ÁGUA TWEZAH Store 1',
            amount: 300.00,
            currency: 'BRL',
            date: new Date('2024-01-18'),
            paymentMethod: 'pix',
            customerName: 'Ana Oliveira',
            liters: 30,
            phoneNumber: '(11) 66666-6666',
            email: 'ana@email.com',
            confidence: 0.85,
            extractionMethod: 'fast'
          },
          qrData: {
            receiptId: 'QR-2024-004',
            storeNumber: '1',
            amount: 300.00,
            date: new Date('2024-01-18'),
            verificationCode: 'V789123456',
            customerId: users[3] ? users[3]._id.toString() : users[0]._id.toString(),
            transactionId: 'TXN-004',
            rawData: '{"receiptId":"QR-2024-004","storeNumber":"1","amount":300.00,"date":"2024-01-18T00:00:00.000Z","verificationCode":"V789123456","customerId":"' + (users[3] ? users[3]._id.toString() : users[0]._id.toString()) + '","transactionId":"TXN-004"}',
            confidence: 1.0,
            extractionMethod: 'direct'
          },
          rejectionReason: 'Invalid verification code',
          processedBy: users[0]._id,
          processedAt: new Date('2024-01-18T16:45:00')
        },
        {
          userId: users[4] ? users[4]._id : users[0]._id,
          storeId: stores[1] ? stores[1]._id : stores[0]._id,
          invoiceNumber: 'INV-2024-005',
          amount: 120.00,
          date: new Date('2024-01-19'),
          status: 'provisional',
          filePath: '/uploads/receipts/receipt-005.jpg',
          ocrExtractedText: 'INVOICE #INV-2024-005\nStore: ÁGUA TWEZAH Store 2\nCustomer: Carlos Ferreira\nPhone: (11) 55555-5555\nEmail: carlos@email.com\nLiters: 12\nAmount: R$ 120.00\nDate: 19/01/2024\nPayment: Credit Card',
          ocrData: {
            invoiceNumber: 'INV-2024-005',
            storeName: 'ÁGUA TWEZAH Store 2',
            amount: 120.00,
            currency: 'BRL',
            date: new Date('2024-01-19'),
            paymentMethod: 'credit_card',
            customerName: 'Carlos Ferreira',
            liters: 12,
            phoneNumber: '(11) 55555-5555',
            email: 'carlos@email.com',
            confidence: 0.90,
            extractionMethod: 'fast'
          },
          qrData: {
            receiptId: 'QR-2024-005',
            storeNumber: '2',
            amount: 120.00,
            date: new Date('2024-01-19'),
            verificationCode: 'V321654987',
            customerId: users[4] ? users[4]._id.toString() : users[0]._id.toString(),
            transactionId: 'TXN-005',
            rawData: '{"receiptId":"QR-2024-005","storeNumber":"2","amount":120.00,"date":"2024-01-19T00:00:00.000Z","verificationCode":"V321654987","customerId":"' + (users[4] ? users[4]._id.toString() : users[0]._id.toString()) + '","transactionId":"TXN-005"}',
            confidence: 1.0,
            extractionMethod: 'direct'
          },
          pointsAwarded: 12,
          cashbackAwarded: 6.00
        }
      ];

      // Insert sample scan uploads
      await this.seedCollection(this.collectionName, sampleScanUploads);
      console.log(`   ✅ Created ${sampleScanUploads.length} sample scan uploads with OCR and QR code data`);

    } catch (error) {
      console.error(`   ❌ Error seeding ${this.collectionName}:`, error.message);
      throw error;
    }
  }
}

module.exports = ScanUploadSeeder;