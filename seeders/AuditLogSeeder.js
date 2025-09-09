const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Audit Log seeder - Creates sample audit logs
 */
class AuditLogSeeder extends BaseSeeder {
  async seed() {
    console.log('🔍 Seeding audit logs...');
    
    const existingCount = await this.getExistingCount('auditlogs');
    if (existingCount > 0) {
      console.log(`ℹ️  Audit logs collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping audit logs seeding - users collection is empty');
      return;
    }

    const auditLogs = [
      {
        user_id: users[0]._id,
        action: 'CREATE',
        resource_type: 'user',
        resource_id: 'user_123',
        description: 'Created new user account',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          new_values: {
            username: 'newuser',
            email: 'newuser@example.com',
            role: 'customer'
          },
          old_values: null
        },
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        user_id: users[1]._id,
        action: 'UPDATE',
        resource_type: 'product',
        resource_id: 'product_456',
        description: 'Updated product pricing',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: {
          new_values: {
            price: 4.50
          },
          old_values: {
            price: 4.00
          }
        },
        timestamp: new Date(Date.now() - 7200000) // 2 hours ago
      },
      {
        user_id: users[2]._id,
        action: 'DELETE',
        resource_type: 'campaign',
        resource_id: 'campaign_789',
        description: 'Deleted expired campaign',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        metadata: {
          new_values: null,
          old_values: {
            name: 'Expired Summer Campaign',
            status: 'expired'
          }
        },
        timestamp: new Date(Date.now() - 10800000) // 3 hours ago
      },
      {
        user_id: users[0]._id,
        action: 'LOGIN',
        resource_type: 'user_session',
        resource_id: 'session_123',
        description: 'User logged into system',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          login_method: 'email',
          session_duration: 3600,
          two_factor_used: false
        },
        timestamp: new Date(Date.now() - 14400000) // 4 hours ago
      },
      {
        user_id: users[3]._id,
        action: 'UPDATE',
        resource_type: 'user',
        resource_id: 'user_456',
        description: 'Updated user role permissions',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
        metadata: {
          new_values: {
            role: 'manager',
            permissions: ['read_users', 'update_products', 'view_reports']
          },
          old_values: {
            role: 'staff',
            permissions: ['read_users']
          }
        },
        timestamp: new Date(Date.now() - 18000000) // 5 hours ago
      },
      {
        user_id: users[1]._id,
        action: 'CREATE',
        resource_type: 'sale',
        resource_id: 'sale_789',
        description: 'Created new sale transaction',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: {
          new_values: {
            transaction_id: 'TXN123456',
            amount: 25.50,
            customer_id: 'customer_123'
          },
          old_values: null
        },
        timestamp: new Date(Date.now() - 21600000) // 6 hours ago
      },
      {
        user_id: users[2]._id,
        action: 'UPDATE',
        resource_type: 'store',
        resource_id: 'store_123',
        description: 'Updated store operating hours',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        metadata: {
          new_values: {
            operating_hours: {
              monday: { open: '08:00', close: '20:00' }
            }
          },
          old_values: {
            operating_hours: {
              monday: { open: '08:00', close: '18:00' }
            }
          }
        },
        timestamp: new Date(Date.now() - 25200000) // 7 hours ago
      },
      {
        user_id: users[0]._id,
        action: 'LOGOUT',
        resource_type: 'user_session',
        resource_id: 'session_456',
        description: 'User logged out of system',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          session_duration: 7200,
          logout_reason: 'user_initiated'
        },
        timestamp: new Date(Date.now() - 28800000) // 8 hours ago
      },
      {
        user_id: users[4]._id,
        action: 'UPDATE',
        resource_type: 'commission',
        resource_id: 'commission_123',
        description: 'Updated commission status to paid',
        ip_address: '192.168.1.104',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          new_values: {
            status: 'paid',
            payment_date: new Date(),
            payment_reference: 'PAY123456'
          },
          old_values: {
            status: 'approved',
            payment_date: null,
            payment_reference: null
          }
        },
        timestamp: new Date(Date.now() - 32400000) // 9 hours ago
      },
      {
        user_id: users[3]._id,
        action: 'CREATE',
        resource_type: 'campaign',
        resource_id: 'campaign_456',
        description: 'Created new marketing campaign',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
        metadata: {
          new_values: {
            name: 'Winter Hydration Campaign',
            type: 'discount',
            discount_percentage: 20,
            start_date: new Date(),
            end_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
          },
          old_values: null
        },
        timestamp: new Date(Date.now() - 36000000) // 10 hours ago
      }
    ];

    await this.seedCollection('auditlogs', auditLogs, { clearFirst: false });
  }
}

module.exports = AuditLogSeeder;