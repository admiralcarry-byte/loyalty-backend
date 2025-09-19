const BaseSeeder = require('./BaseSeeder');

/**
 * Product seeder - Creates sample products for the system
 */
class ProductSeeder extends BaseSeeder {
  async seed() {
    console.log('🥤 Seeding products...');
    
    const existingCount = await this.getExistingCount('products');
    if (existingCount > 0) {
      console.log(`ℹ️  Products collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const products = [
      {
        name: 'ÁGUA TWEZAH Premium 500ml',
        sku: 'AT-PREMIUM-500',
        description: 'Premium purified water in 500ml bottle',
        category: 'water',
        type: 'bottle',
        size: '500ml',
        price: {
          current: 2.50,
          original: 2.50,
          wholesale: 2.00,
          bulk: 1.80
        },
        cost: 1.20,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 1000,
          reserved: 0,
          minimum_stock: 100,
          reorder_point: 50,
          max_stock: 2000
        },
        weight: 0.6,
        dimensions: {
          length: 8.5,
          width: 6.5,
          height: 22.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium', 'potassium']
        },
        images: [
          'https://aguatwezah.com/images/premium-500ml-1.jpg',
          'https://aguatwezah.com/images/premium-500ml-2.jpg'
        ],
        tags: ['premium', '500ml', 'purified', 'bottle'],
        points_per_purchase: 2,
        cashback_percentage: 5,
        is_featured: true,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Standard 1L',
        sku: 'AT-STANDARD-1L',
        description: 'Standard purified water in 1L bottle',
        category: 'water',
        type: 'bottle',
        size: '1L',
        price: {
          current: 4.00,
          original: 4.00,
          wholesale: 3.20,
          bulk: 2.80
        },
        cost: 1.80,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 800,
          reserved: 0,
          minimum_stock: 150,
          reorder_point: 75,
          max_stock: 1500
        },
        weight: 1.1,
        dimensions: {
          length: 10.0,
          width: 7.5,
          height: 28.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium']
        },
        images: [
          'https://aguatwezah.com/images/standard-1l-1.jpg',
          'https://aguatwezah.com/images/standard-1l-2.jpg'
        ],
        tags: ['standard', '1l', 'purified', 'bottle'],
        points_per_purchase: 4,
        cashback_percentage: 3,
        is_featured: false,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Family 5L',
        sku: 'AT-FAMILY-5L',
        description: 'Family size purified water in 5L bottle',
        category: 'water',
        type: 'bottle',
        size: '5L',
        price: {
          current: 15.00,
          original: 15.00,
          wholesale: 12.00,
          bulk: 10.00
        },
        cost: 6.50,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 300,
          reserved: 0,
          minimum_stock: 50,
          reorder_point: 25,
          max_stock: 500
        },
        weight: 5.2,
        dimensions: {
          length: 20.0,
          width: 15.0,
          height: 35.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium', 'potassium', 'fluoride']
        },
        images: [
          'https://aguatwezah.com/images/family-5l-1.jpg',
          'https://aguatwezah.com/images/family-5l-2.jpg'
        ],
        tags: ['family', '5l', 'purified', 'bottle', 'bulk'],
        points_per_purchase: 15,
        cashback_percentage: 8,
        is_featured: true,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Premium 1.5L',
        sku: 'AT-PREMIUM-1.5L',
        description: 'Premium purified water in 1.5L bottle with enhanced minerals',
        category: 'water',
        type: 'bottle',
        size: '1.5L',
        price: {
          current: 5.50,
          original: 5.50,
          wholesale: 4.40,
          bulk: 3.80
        },
        cost: 2.30,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 600,
          reserved: 0,
          minimum_stock: 100,
          reorder_point: 50,
          max_stock: 1000
        },
        weight: 1.6,
        dimensions: {
          length: 12.0,
          width: 8.0,
          height: 30.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium', 'potassium', 'zinc', 'selenium']
        },
        images: [
          'https://aguatwezah.com/images/premium-1.5l-1.jpg',
          'https://aguatwezah.com/images/premium-1.5l-2.jpg'
        ],
        tags: ['premium', '1.5l', 'enhanced', 'minerals', 'bottle'],
        points_per_purchase: 5,
        cashback_percentage: 6,
        is_featured: true,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Sparkling 500ml',
        sku: 'AT-SPARKLING-500',
        description: 'Sparkling water with natural carbonation in 500ml bottle',
        category: 'water',
        type: 'bottle',
        size: '500ml',
        price: {
          current: 3.50,
          original: 3.50,
          wholesale: 2.80,
          bulk: 2.40
        },
        cost: 1.60,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 400,
          reserved: 0,
          minimum_stock: 75,
          reorder_point: 38,
          max_stock: 800
        },
        weight: 0.6,
        dimensions: {
          length: 8.5,
          width: 6.5,
          height: 22.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium'],
          carbonation: 'natural'
        },
        images: [
          'https://aguatwezah.com/images/sparkling-500ml-1.jpg',
          'https://aguatwezah.com/images/sparkling-500ml-2.jpg'
        ],
        tags: ['sparkling', '500ml', 'carbonated', 'bottle', 'premium'],
        points_per_purchase: 3,
        cashback_percentage: 4,
        is_featured: false,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Subscription - Monthly',
        sku: 'AT-SUB-MONTHLY',
        description: 'Monthly subscription for regular water delivery',
        category: 'subscription',
        type: 'service',
        size: 'monthly',
        price: {
          current: 25.00,
          original: 25.00,
          wholesale: 20.00,
          bulk: 17.50
        },
        cost: 12.00,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 9999,
          reserved: 0,
          minimum_stock: 0,
          reorder_point: 0,
          max_stock: 9999
        },
        weight: 0,
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'cm'
        },
        packaging: {
          material: 'digital',
          recyclable: true,
          biodegradable: true
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: []
        },
        images: [
          'https://aguatwezah.com/images/subscription-monthly.jpg'
        ],
        tags: ['subscription', 'monthly', 'delivery', 'service'],
        points_per_purchase: 25,
        cashback_percentage: 10,
        is_featured: true,
        is_digital: true
      },
      {
        name: 'ÁGUA TWEZAH Bottle Exchange',
        sku: 'AT-EXCHANGE',
        description: 'Bottle exchange service - return empty bottles for credit',
        category: 'service',
        type: 'exchange',
        size: 'per_bottle',
        price: {
          current: 0.50,
          original: 0.50,
          wholesale: 0.40,
          bulk: 0.35
        },
        cost: 0.00,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 9999,
          reserved: 0,
          minimum_stock: 0,
          reorder_point: 0,
          max_stock: 9999
        },
        weight: 0,
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'cm'
        },
        packaging: {
          material: 'service',
          recyclable: true,
          biodegradable: true
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: []
        },
        images: [
          'https://aguatwezah.com/images/bottle-exchange.jpg'
        ],
        tags: ['exchange', 'service', 'recycling', 'credit'],
        points_per_purchase: 1,
        cashback_percentage: 0,
        is_featured: false,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Sports 750ml',
        sku: 'AT-SPORTS-750',
        description: 'Sports water bottle with enhanced electrolytes',
        category: 'water',
        type: 'bottle',
        size: '750ml',
        price: {
          current: 3.00,
          original: 3.00,
          wholesale: 2.40,
          bulk: 2.10
        },
        cost: 1.40,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 500,
          reserved: 0,
          minimum_stock: 100,
          reorder_point: 50,
          max_stock: 1000
        },
        weight: 0.8,
        dimensions: {
          length: 9.0,
          width: 7.0,
          height: 25.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium', 'potassium', 'sodium']
        },
        images: [
          'https://aguatwezah.com/images/sports-750ml-1.jpg',
          'https://aguatwezah.com/images/sports-750ml-2.jpg'
        ],
        tags: ['sports', '750ml', 'electrolytes', 'bottle'],
        points_per_purchase: 3,
        cashback_percentage: 4,
        is_featured: false,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Kids 250ml',
        sku: 'AT-KIDS-250',
        description: 'Kid-friendly water bottle with fun design',
        category: 'water',
        type: 'bottle',
        size: '250ml',
        price: {
          current: 1.50,
          original: 1.50,
          wholesale: 1.20,
          bulk: 1.05
        },
        cost: 0.70,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 800,
          reserved: 0,
          minimum_stock: 150,
          reorder_point: 75,
          max_stock: 1500
        },
        weight: 0.3,
        dimensions: {
          length: 6.0,
          width: 5.0,
          height: 18.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'fluoride']
        },
        images: [
          'https://aguatwezah.com/images/kids-250ml-1.jpg',
          'https://aguatwezah.com/images/kids-250ml-2.jpg'
        ],
        tags: ['kids', '250ml', 'fun', 'bottle'],
        points_per_purchase: 1,
        cashback_percentage: 2,
        is_featured: false,
        is_digital: false
      },
      {
        name: 'ÁGUA TWEZAH Office 2L',
        sku: 'AT-OFFICE-2L',
        description: 'Office water dispenser bottle',
        category: 'water',
        type: 'bottle',
        size: '2L',
        price: {
          current: 6.00,
          original: 6.00,
          wholesale: 4.80,
          bulk: 4.20
        },
        cost: 2.80,
        currency: 'USD',
        status: 'active',
        inventory: {
          quantity: 200,
          reserved: 0,
          minimum_stock: 50,
          reorder_point: 25,
          max_stock: 400
        },
        weight: 2.1,
        dimensions: {
          length: 15.0,
          width: 10.0,
          height: 32.0,
          unit: 'cm'
        },
        packaging: {
          material: 'PET',
          recyclable: true,
          biodegradable: false
        },
        nutritional_info: {
          calories: 0,
          sodium: 0,
          minerals: ['calcium', 'magnesium', 'potassium']
        },
        images: [
          'https://aguatwezah.com/images/office-2l-1.jpg',
          'https://aguatwezah.com/images/office-2l-2.jpg'
        ],
        tags: ['office', '2l', 'dispenser', 'bottle'],
        points_per_purchase: 6,
        cashback_percentage: 5,
        is_featured: false,
        is_digital: false
      }
    ];

    await this.seedCollection('products', products, { clearFirst: false });
  }
}

module.exports = ProductSeeder;