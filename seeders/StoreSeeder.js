const BaseSeeder = require('./BaseSeeder');

/**
 * Store seeder - Creates sample stores for the system
 */
class StoreSeeder extends BaseSeeder {
  async seed() {
    console.log('🏪 Seeding stores...');
    
    const existingCount = await this.getExistingCount('stores');
    if (existingCount > 0) {
      console.log(`ℹ️  Stores collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const stores = [
      {
        name: 'ÁGUA TWEZAH - Luanda Centro',
        code: 'ATL001',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [13.2344, -8.8159] // Luanda coordinates
        },
        contact: {
          phone: '+244123456789',
          email: 'luanda.centro@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Maria Silva',
          phone: '+244987654321',
          email: 'maria.silva@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '08:00', close: '18:00', closed: false },
          tuesday: { open: '08:00', close: '18:00', closed: false },
          wednesday: { open: '08:00', close: '18:00', closed: false },
          thursday: { open: '08:00', close: '18:00', closed: false },
          friday: { open: '08:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '14:00', closed: false }
        },
        services: ['water_delivery', 'bottle_exchange', 'pickup'],
        payment_methods: ['cash', 'mobile_money', 'bank_transfer'],
        commission_rate: 5,
        minimum_order: 10,
        delivery_radius: 15,
        delivery_fee: 2.5,
        inventory: {
          total_bottles: 500,
          available_bottles: 450,
          reserved_bottles: 50
        },
        performance: {
          total_sales: 25000,
          total_orders: 150,
          average_order_value: 166.67,
          customer_count: 75
        },
        notes: 'Main store in Luanda city center',
        tags: ['premium', 'city-center', 'delivery']
      },
      {
        name: 'ÁGUA TWEZAH - Benguela',
        code: 'ATB001',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Avenida 4 de Fevereiro, 456',
          city: 'Benguela',
          state: 'Benguela',
          postal_code: '2000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [13.4053, -12.5763] // Benguela coordinates
        },
        contact: {
          phone: '+244555666777',
          email: 'benguela@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'João Santos',
          phone: '+244111222333',
          email: 'joao.santos@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '15:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'bottle_exchange'],
        payment_methods: ['cash', 'mobile_money'],
        commission_rate: 4,
        minimum_order: 15,
        delivery_radius: 20,
        delivery_fee: 3.0,
        inventory: {
          total_bottles: 300,
          available_bottles: 280,
          reserved_bottles: 20
        },
        performance: {
          total_sales: 15000,
          total_orders: 100,
          average_order_value: 150.00,
          customer_count: 50
        },
        notes: 'Coastal city store with good customer base',
        tags: ['coastal', 'retail', 'delivery']
      },
      {
        name: 'ÁGUA TWEZAH - Huambo',
        code: 'ATH001',
        type: 'wholesale',
        status: 'active',
        address: {
          street: 'Rua do Comércio, 789',
          city: 'Huambo',
          state: 'Huambo',
          postal_code: '3000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [15.7353, -12.7761] // Huambo coordinates
        },
        contact: {
          phone: '+244444555666',
          email: 'huambo@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Ana Costa',
          phone: '+244777888999',
          email: 'ana.costa@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '07:00', close: '19:00', closed: false },
          tuesday: { open: '07:00', close: '19:00', closed: false },
          wednesday: { open: '07:00', close: '19:00', closed: false },
          thursday: { open: '07:00', close: '19:00', closed: false },
          friday: { open: '07:00', close: '19:00', closed: false },
          saturday: { open: '08:00', close: '16:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'bulk_orders', 'subscription'],
        payment_methods: ['cash', 'bank_transfer', 'credit_card'],
        commission_rate: 3,
        minimum_order: 50,
        delivery_radius: 30,
        delivery_fee: 5.0,
        inventory: {
          total_bottles: 1000,
          available_bottles: 900,
          reserved_bottles: 100
        },
        performance: {
          total_sales: 50000,
          total_orders: 200,
          average_order_value: 250.00,
          customer_count: 25
        },
        notes: 'Wholesale store serving businesses and large orders',
        tags: ['wholesale', 'business', 'bulk']
      },
      {
        name: 'ÁGUA TWEZAH - Online Store',
        code: 'ATO001',
        type: 'online',
        status: 'active',
        address: {
          street: 'Digital Platform',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [13.2344, -8.8159] // Luanda coordinates
        },
        contact: {
          phone: '+244123456789',
          email: 'online@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Carlos Fernandes',
          phone: '+244999888777',
          email: 'carlos.fernandes@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
        },
        services: ['water_delivery', 'subscription', 'online_orders'],
        payment_methods: ['mobile_money', 'bank_transfer', 'credit_card', 'debit_card'],
        commission_rate: 2,
        minimum_order: 5,
        delivery_radius: 50,
        delivery_fee: 1.5,
        inventory: {
          total_bottles: 2000,
          available_bottles: 1800,
          reserved_bottles: 200
        },
        performance: {
          total_sales: 75000,
          total_orders: 500,
          average_order_value: 150.00,
          customer_count: 200
        },
        notes: 'Online platform for nationwide delivery',
        tags: ['online', 'nationwide', 'digital']
      },
      {
        name: 'ÁGUA TWEZAH - Luanda Sul',
        code: 'ATL002',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Avenida de Portugal, 321',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1001',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [13.2344, -8.8159] // Luanda coordinates
        },
        contact: {
          phone: '+244123456790',
          email: 'luanda.sul@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Pedro Oliveira',
          phone: '+244987654322',
          email: 'pedro.oliveira@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '08:00', close: '18:00', closed: false },
          tuesday: { open: '08:00', close: '18:00', closed: false },
          wednesday: { open: '08:00', close: '18:00', closed: false },
          thursday: { open: '08:00', close: '18:00', closed: false },
          friday: { open: '08:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '14:00', closed: false }
        },
        services: ['water_delivery', 'bottle_exchange', 'pickup'],
        payment_methods: ['cash', 'mobile_money', 'bank_transfer'],
        commission_rate: 5,
        minimum_order: 10,
        delivery_radius: 15,
        delivery_fee: 2.5,
        inventory: {
          total_bottles: 400,
          available_bottles: 360,
          reserved_bottles: 40
        },
        performance: {
          total_sales: 20000,
          total_orders: 120,
          average_order_value: 166.67,
          customer_count: 60
        },
        notes: 'Southern Luanda store serving residential areas',
        tags: ['residential', 'city-center', 'delivery']
      },
      {
        name: 'ÁGUA TWEZAH - Lobito',
        code: 'ATL003',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Rua da Marginal, 654',
          city: 'Lobito',
          state: 'Benguela',
          postal_code: '2001',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [13.4053, -12.5763] // Benguela coordinates
        },
        contact: {
          phone: '+244555666778',
          email: 'lobito@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Sofia Rodrigues',
          phone: '+244111222334',
          email: 'sofia.rodrigues@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '15:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'bottle_exchange'],
        payment_methods: ['cash', 'mobile_money'],
        commission_rate: 4,
        minimum_order: 15,
        delivery_radius: 20,
        delivery_fee: 3.0,
        inventory: {
          total_bottles: 250,
          available_bottles: 230,
          reserved_bottles: 20
        },
        performance: {
          total_sales: 12000,
          total_orders: 80,
          average_order_value: 150.00,
          customer_count: 40
        },
        notes: 'Port city store with growing customer base',
        tags: ['coastal', 'retail', 'delivery']
      },
      {
        name: 'ÁGUA TWEZAH - Kuito',
        code: 'ATK001',
        type: 'wholesale',
        status: 'active',
        address: {
          street: 'Rua da Independência, 987',
          city: 'Kuito',
          state: 'Bié',
          postal_code: '4000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [16.9333, -12.3833] // Kuito coordinates
        },
        contact: {
          phone: '+244444555667',
          email: 'kuito@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Ricardo Mendes',
          phone: '+244777888990',
          email: 'ricardo.mendes@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '07:00', close: '19:00', closed: false },
          tuesday: { open: '07:00', close: '19:00', closed: false },
          wednesday: { open: '07:00', close: '19:00', closed: false },
          thursday: { open: '07:00', close: '19:00', closed: false },
          friday: { open: '07:00', close: '19:00', closed: false },
          saturday: { open: '08:00', close: '16:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'bulk_orders', 'subscription'],
        payment_methods: ['cash', 'bank_transfer', 'credit_card'],
        commission_rate: 3,
        minimum_order: 50,
        delivery_radius: 30,
        delivery_fee: 5.0,
        inventory: {
          total_bottles: 800,
          available_bottles: 720,
          reserved_bottles: 80
        },
        performance: {
          total_sales: 40000,
          total_orders: 160,
          average_order_value: 250.00,
          customer_count: 20
        },
        notes: 'Central highland wholesale store',
        tags: ['wholesale', 'business', 'bulk']
      },
      {
        name: 'ÁGUA TWEZAH - Mobile Unit 1',
        code: 'ATM001',
        type: 'mobile',
        status: 'active',
        address: {
          street: 'Mobile Service',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [13.2344, -8.8159] // Luanda coordinates
        },
        contact: {
          phone: '+244123456791',
          email: 'mobile1@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Fernanda Alves',
          phone: '+244999888778',
          email: 'fernanda.alves@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '10:00', close: '15:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'mobile_sales'],
        payment_methods: ['cash', 'mobile_money'],
        commission_rate: 6,
        minimum_order: 5,
        delivery_radius: 25,
        delivery_fee: 2.0,
        inventory: {
          total_bottles: 200,
          available_bottles: 180,
          reserved_bottles: 20
        },
        performance: {
          total_sales: 15000,
          total_orders: 100,
          average_order_value: 150.00,
          customer_count: 50
        },
        notes: 'Mobile unit serving remote areas',
        tags: ['mobile', 'remote', 'delivery']
      },
      {
        name: 'ÁGUA TWEZAH - Cabinda',
        code: 'ATC001',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Avenida Marginal, 147',
          city: 'Cabinda',
          state: 'Cabinda',
          postal_code: '5000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [12.1972, -5.5500] // Cabinda coordinates
        },
        contact: {
          phone: '+244555666779',
          email: 'cabinda@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Isabel Ferreira',
          phone: '+244111222335',
          email: 'isabel.ferreira@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '15:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'bottle_exchange'],
        payment_methods: ['cash', 'mobile_money'],
        commission_rate: 4,
        minimum_order: 15,
        delivery_radius: 20,
        delivery_fee: 3.0,
        inventory: {
          total_bottles: 350,
          available_bottles: 320,
          reserved_bottles: 30
        },
        performance: {
          total_sales: 18000,
          total_orders: 120,
          average_order_value: 150.00,
          customer_count: 60
        },
        notes: 'Northern enclave store with oil industry focus',
        tags: ['oil-region', 'retail', 'delivery']
      },
      {
        name: 'ÁGUA TWEZAH - Namibe',
        code: 'ATN001',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Rua da República, 258',
          city: 'Namibe',
          state: 'Namibe',
          postal_code: '6000',
          country: 'Angola'
        },
        location: {
          type: 'Point',
          coordinates: [15.1961, -12.1522] // Namibe coordinates
        },
        contact: {
          phone: '+244444555668',
          email: 'namibe@aguatwezah.com',
          website: 'https://aguatwezah.com'
        },
        manager: {
          name: 'Carlos Silva',
          phone: '+244777888991',
          email: 'carlos.silva@aguatwezah.com'
        },
        operating_hours: {
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '15:00', closed: false },
          sunday: { closed: true }
        },
        services: ['water_delivery', 'bottle_exchange'],
        payment_methods: ['cash', 'mobile_money'],
        commission_rate: 4,
        minimum_order: 15,
        delivery_radius: 20,
        delivery_fee: 3.0,
        inventory: {
          total_bottles: 300,
          available_bottles: 280,
          reserved_bottles: 20
        },
        performance: {
          total_sales: 14000,
          total_orders: 90,
          average_order_value: 155.56,
          customer_count: 45
        },
        notes: 'Desert region store with tourism focus',
        tags: ['desert', 'tourism', 'delivery']
      }
    ];

    await this.seedCollection('stores', stores, { clearFirst: false });
  }
}

module.exports = StoreSeeder;