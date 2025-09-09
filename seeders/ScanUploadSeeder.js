const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Scan Upload seeder - Creates sample scan uploads
 */
class ScanUploadSeeder extends BaseSeeder {
  async seed() {
    console.log('📸 Seeding scan uploads...');
    
    const existingCount = await this.getExistingCount('scanuploads');
    if (existingCount > 0) {
      console.log(`ℹ️  Scan uploads collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping scan uploads seeding - users collection is empty');
      return;
    }

    const scanUploads = [];

    // Generate scan uploads
    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const scanUpload = {
        user_id: randomUser._id,
        upload_id: `SU${Date.now()}${i.toString().padStart(3, '0')}`,
        file_name: `receipt-${Date.now()}-${i}.jpg`,
        file_path: `/uploads/receipts/receipt-${Date.now()}-${i}.jpg`,
        file_size: Math.floor(Math.random() * 2000000) + 500000, // 500KB to 2.5MB
        file_type: 'image/jpeg',
        upload_type: ['receipt', 'invoice', 'document'][Math.floor(Math.random() * 3)],
        status: ['pending', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)],
        ocr_text: Math.random() > 0.3 ? 'ÁGUA TWEZAH\nPremium Water 500ml\nQty: 2 x $2.50 = $5.00\nTax: $0.75\nTotal: $5.75' : null,
        extracted_data: Math.random() > 0.3 ? {
          merchant_name: 'ÁGUA TWEZAH',
          total_amount: 5.75,
          currency: 'USD',
          date: new Date(),
          items: [
            {
              name: 'Premium Water 500ml',
              quantity: 2,
              price: 2.50
            }
          ]
        } : null,
        confidence_score: Math.random() > 0.3 ? Math.random() * 0.4 + 0.6 : null, // 60-100%
        processing_time: Math.random() > 0.3 ? Math.floor(Math.random() * 5000) + 1000 : null, // 1-6 seconds
        error_message: Math.random() > 0.8 ? 'OCR processing failed - image quality too low' : null,
        metadata: {
          device_info: {
            user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
            platform: 'mobile'
          },
          image_quality: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
          upload_source: 'mobile_app'
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      scanUploads.push(scanUpload);
    }

    await this.seedCollection('scanuploads', scanUploads, { clearFirst: false });
  }
}

module.exports = ScanUploadSeeder;