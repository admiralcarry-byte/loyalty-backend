const BaseSeeder = require('./BaseSeeder');
const bcrypt = require('bcryptjs');

/**
 * User seeder - Creates sample users for the system
 */
class UserSeeder extends BaseSeeder {
  async seed() {
    console.log('👥 Seeding users...');
    
    const existingCount = await this.getExistingCount('users');
    if (existingCount > 0) {
      console.log(`ℹ️  Users collection already has ${existingCount} records. Clearing first...`);
      await this.clearCollection('users');
    }

    const users = [
      {
        username: 'admin',
        email: 'admin@aguatwezah.com',
        password_hash: await bcrypt.hash('admin123', 12),
        first_name: 'Admin',
        last_name: 'User',
        phone: '+244123456789',
        role: 'admin',
        status: 'active',
        loyalty_tier: 'platinum',
        points_balance: 5000,
        liter_balance: 100,
        total_purchases: 50,
        total_liters: 500,
        total_points_earned: 10000,
        total_points_spent: 5000,
        last_login: new Date(),
        address: {
          street: 'Rua da Independência, 123',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1000',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'manager1',
        email: 'manager@aguatwezah.com',
        password_hash: await bcrypt.hash('manager123', 12),
        first_name: 'Maria',
        last_name: 'Silva',
        phone: '+244987654321',
        role: 'manager',
        status: 'active',
        loyalty_tier: 'gold',
        points_balance: 2500,
        liter_balance: 50,
        total_purchases: 25,
        total_liters: 250,
        total_points_earned: 5000,
        total_points_spent: 2500,
        last_login: new Date(Date.now() - 86400000), // 1 day ago
        address: {
          street: 'Avenida 4 de Fevereiro, 456',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1001',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: false
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'customer1',
        email: 'customer@example.com',
        password_hash: await bcrypt.hash('customer123', 12),
        first_name: 'João',
        last_name: 'Santos',
        phone: '+244555666777',
        role: 'customer',
        status: 'active',
        loyalty_tier: 'silver',
        points_balance: 750,
        liter_balance: 15,
        total_purchases: 8,
        total_liters: 80,
        total_points_earned: 1500,
        total_points_spent: 750,
        last_login: new Date(Date.now() - 172800000), // 2 days ago
        address: {
          street: 'Rua Amílcar Cabral, 789',
          city: 'Benguela',
          state: 'Benguela',
          postal_code: '2000',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: false
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'influencer1',
        email: 'influencer@example.com',
        password_hash: await bcrypt.hash('influencer123', 12),
        first_name: 'Ana',
        last_name: 'Costa',
        phone: '+244111222333',
        role: 'influencer',
        status: 'active',
        loyalty_tier: 'gold',
        points_balance: 3000,
        liter_balance: 60,
        total_purchases: 30,
        total_liters: 300,
        total_points_earned: 6000,
        total_points_spent: 3000,
        last_login: new Date(Date.now() - 3600000), // 1 hour ago
        address: {
          street: 'Rua da Marginal, 321',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1002',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: true,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'staff1',
        email: 'staff@aguatwezah.com',
        password_hash: await bcrypt.hash('staff123', 12),
        first_name: 'Carlos',
        last_name: 'Fernandes',
        phone: '+244444555666',
        role: 'staff',
        status: 'active',
        loyalty_tier: 'lead',
        points_balance: 100,
        liter_balance: 5,
        total_purchases: 2,
        total_liters: 20,
        total_points_earned: 200,
        total_points_spent: 100,
        last_login: new Date(Date.now() - 7200000), // 2 hours ago
        address: {
          street: 'Rua do Comércio, 654',
          city: 'Huambo',
          state: 'Huambo',
          postal_code: '3000',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: false
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'kevin_customer',
        email: 'kevin@example.com',
        password_hash: await bcrypt.hash('customer123', 12),
        first_name: 'Kevin',
        last_name: 'Customer',
        phone: '8990989899',
        role: 'customer',
        status: 'active',
        loyalty_tier: 'lead',
        points_balance: 0,
        liter_balance: 0,
        total_purchases: 0,
        total_liters: 0,
        total_points_earned: 0,
        total_points_spent: 0,
        last_login: new Date(),
        address: {
          street: 'Test Street, 123',
          city: 'Test City',
          state: 'Test State',
          postal_code: '12345',
          country: 'Test Country'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'en',
          timezone: 'UTC'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'customer2',
        email: 'customer2@example.com',
        password_hash: await bcrypt.hash('customer123', 12),
        first_name: 'Pedro',
        last_name: 'Oliveira',
        phone: '+244777888999',
        role: 'customer',
        status: 'active',
        loyalty_tier: 'lead',
        points_balance: 200,
        liter_balance: 8,
        total_purchases: 3,
        total_liters: 30,
        total_points_earned: 400,
        total_points_spent: 200,
        last_login: new Date(Date.now() - 259200000), // 3 days ago
        address: {
          street: 'Rua da Liberdade, 456',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1003',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'influencer2',
        email: 'influencer2@example.com',
        password_hash: await bcrypt.hash('influencer123', 12),
        first_name: 'Sofia',
        last_name: 'Rodrigues',
        phone: '+244333444555',
        role: 'influencer',
        status: 'active',
        loyalty_tier: 'silver',
        points_balance: 1500,
        liter_balance: 30,
        total_purchases: 15,
        total_liters: 150,
        total_points_earned: 3000,
        total_points_spent: 1500,
        last_login: new Date(Date.now() - 432000000), // 5 days ago
        address: {
          street: 'Avenida Marginal, 789',
          city: 'Benguela',
          state: 'Benguela',
          postal_code: '2001',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: false
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'manager2',
        email: 'manager2@aguatwezah.com',
        password_hash: await bcrypt.hash('manager123', 12),
        first_name: 'Ricardo',
        last_name: 'Mendes',
        phone: '+244666777888',
        role: 'manager',
        status: 'active',
        loyalty_tier: 'platinum',
        points_balance: 4000,
        liter_balance: 80,
        total_purchases: 40,
        total_liters: 400,
        total_points_earned: 8000,
        total_points_spent: 4000,
        last_login: new Date(Date.now() - 604800000), // 7 days ago
        address: {
          street: 'Rua da República, 321',
          city: 'Huambo',
          state: 'Huambo',
          postal_code: '3001',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: true,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'customer3',
        email: 'customer3@example.com',
        password_hash: await bcrypt.hash('customer123', 12),
        first_name: 'Isabel',
        last_name: 'Ferreira',
        phone: '+244999000111',
        role: 'customer',
        status: 'active',
        loyalty_tier: 'gold',
        points_balance: 2000,
        liter_balance: 40,
        total_purchases: 20,
        total_liters: 200,
        total_points_earned: 4000,
        total_points_spent: 2000,
        last_login: new Date(Date.now() - 777600000), // 9 days ago
        address: {
          street: 'Rua da Paz, 654',
          city: 'Luanda',
          state: 'Luanda',
          postal_code: '1004',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: false
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: true
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      },
      {
        username: 'staff2',
        email: 'staff2@aguatwezah.com',
        password_hash: await bcrypt.hash('staff123', 12),
        first_name: 'Fernanda',
        last_name: 'Alves',
        phone: '+244222333444',
        role: 'staff',
        status: 'active',
        loyalty_tier: 'silver',
        points_balance: 500,
        liter_balance: 12,
        total_purchases: 5,
        total_liters: 50,
        total_points_earned: 1000,
        total_points_spent: 500,
        last_login: new Date(Date.now() - 950400000), // 11 days ago
        address: {
          street: 'Rua da Esperança, 987',
          city: 'Benguela',
          state: 'Benguela',
          postal_code: '2002',
          country: 'Angola'
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'pt',
          timezone: 'Africa/Luanda'
        },
        verification: {
          email_verified: true,
          phone_verified: false
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        }
      }
    ];

    // Generate referral codes for users
    users.forEach(user => {
      if (!user.referral_code) {
        user.referral_code = this.generateReferralCode();
      }
    });

    await this.seedCollection('users', users, { clearFirst: false });
  }

  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = UserSeeder;