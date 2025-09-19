const BaseSeeder = require('./BaseSeeder');

/**
 * Store seeder - Creates sample stores for the system
 */
class StoreSeeder extends BaseSeeder {
  async seed() {
    console.log('🏪 Seeding stores...');
    
    const existingCount = await this.getExistingCount('stores');
    if (existingCount > 0) {
      console.log(`ℹ️  Stores collection already has ${existingCount} records. Clearing first...`);
      await this.clearCollection('stores');
    }

    const stores = [
      {
        name: 'ÁGUA TWEZAH - Luanda Centro',
        status: 'active',
        address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '460',
          country: 'Angola'
        },
        contact: {
          phone: '+244123456789',
          email: 'luanda.centro@aguatwezah.com'
        },
        manager: {
          name: 'Maria Silva',
          phone: '+244987654321',
          email: 'maria.silva@aguatwezah.com'
        }
      },
      {
        name: 'ÁGUA TWEZAH - Benguela',
        status: 'active',
        address: {
          street: 'Avenida 4 de Fevereiro, 456',
          city: 'Benguela',
          state: 'Benguela',
          postal_code: '461',
          country: 'Angola'
        },
        contact: {
          phone: '+244555666777',
          email: 'benguela@aguatwezah.com'
        },
        manager: {
          name: 'João Santos',
          phone: '+244111222333',
          email: 'joao.santos@aguatwezah.com'
        }
      },
      {
        name: 'ÁGUA TWEZAH - Huambo',
        status: 'active',
        address: {
          street: 'Rua do Comércio, 789',
          city: 'Huambo',
          state: 'Huambo',
          postal_code: '462',
          country: 'Angola'
        },
        contact: {
          phone: '+244333444555',
          email: 'huambo@aguatwezah.com'
        },
        manager: {
          name: 'Pedro Costa',
          phone: '+244666777888',
          email: 'pedro.costa@aguatwezah.com'
        }
      },
      {
        name: 'ÁGUA TWEZAH - Online Store',
        status: 'active',
        address: {
          street: 'Digital Platform',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '463',
          country: 'Angola'
        },
        contact: {
          phone: '+244777888999',
          email: 'online@aguatwezah.com'
        },
        manager: {
          name: 'Ana Digital',
          phone: '+244888999000',
          email: 'ana.digital@aguatwezah.com'
        }
      },
      {
        name: 'ÁGUA TWEZAH - Luanda Sul',
        status: 'active',
        address: {
          street: 'Avenida de Portugal, 321',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '464',
          country: 'Angola'
        },
        contact: {
          phone: '+244999000111',
          email: 'luanda.sul@aguatwezah.com'
        },
        manager: {
          name: 'Carlos Sul',
          phone: '+244000111222',
          email: 'carlos.sul@aguatwezah.com'
        }
      },
      {
        name: 'ÁGUA TWEZAH - Lobito',
        status: 'active',
        address: {
          street: 'Rua da Marginal, 654',
          city: 'Lobito',
          state: 'Benguela',
          postal_code: '465',
          country: 'Angola'
        },
        contact: {
          phone: '+244111222333',
          email: 'lobito@aguatwezah.com'
        },
        manager: {
          name: 'Sofia Lobito',
          phone: '+244222333444',
          email: 'sofia.lobito@aguatwezah.com'
        }
      }
    ];

    await this.seedCollection('stores', stores, { clearFirst: false });
  }
}

module.exports = StoreSeeder;