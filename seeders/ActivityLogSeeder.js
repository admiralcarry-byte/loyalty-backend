const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Activity Log seeder - Creates sample activity logs
 */
class ActivityLogSeeder extends BaseSeeder {
  async seed() {
    console.log('📝 Seeding activity logs...');
    
    const existingCount = await this.getExistingCount('activitylogs');
    if (existingCount > 0) {
      console.log(`ℹ️  Activity logs collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping activity logs seeding - users collection is empty');
      return;
    }

    const activityLogs = [
      {
        user_id: users[0]._id,
        action: 'login',
        description: 'User logged into the system',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          login_method: 'email',
          session_duration: 3600
        },
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        user_id: users[1]._id,
        action: 'purchase',
        description: 'User made a purchase',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: {
          purchase_amount: 25.50,
          items_count: 3,
          payment_method: 'mobile_money'
        },
        timestamp: new Date(Date.now() - 7200000) // 2 hours ago
      },
      {
        user_id: users[2]._id,
        action: 'profile_update',
        description: 'User updated their profile information',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        metadata: {
          fields_updated: ['phone', 'address'],
          previous_values: {
            phone: '+244555666777',
            address: 'Old address'
          }
        },
        timestamp: new Date(Date.now() - 10800000) // 3 hours ago
      },
      {
        user_id: users[0]._id,
        action: 'password_change',
        description: 'User changed their password',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          password_strength: 'strong',
          change_reason: 'security_update'
        },
        timestamp: new Date(Date.now() - 14400000) // 4 hours ago
      },
      {
        user_id: users[3]._id,
        action: 'referral',
        description: 'User referred a new customer',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
        metadata: {
          referred_user_id: 'new_user_123',
          referral_code: 'REF123456',
          bonus_points: 50
        },
        timestamp: new Date(Date.now() - 18000000) // 5 hours ago
      },
      {
        user_id: users[1]._id,
        action: 'points_redemption',
        description: 'User redeemed points for discount',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: {
          points_used: 200,
          discount_amount: 2.00,
          remaining_points: 550
        },
        timestamp: new Date(Date.now() - 21600000) // 6 hours ago
      },
      {
        user_id: users[2]._id,
        action: 'campaign_participation',
        description: 'User participated in a marketing campaign',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        metadata: {
          campaign_id: 'campaign_123',
          campaign_name: 'Summer Hydration',
          reward_earned: '15% discount'
        },
        timestamp: new Date(Date.now() - 25200000) // 7 hours ago
      },
      {
        user_id: users[0]._id,
        action: 'subscription_update',
        description: 'User updated their subscription plan',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          previous_plan: 'basic',
          new_plan: 'premium',
          billing_cycle: 'monthly'
        },
        timestamp: new Date(Date.now() - 28800000) // 8 hours ago
      },
      {
        user_id: users[3]._id,
        action: 'support_ticket',
        description: 'User created a support ticket',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
        metadata: {
          ticket_id: 'TICKET123456',
          category: 'delivery_issue',
          priority: 'medium'
        },
        timestamp: new Date(Date.now() - 32400000) // 9 hours ago
      },
      {
        user_id: users[1]._id,
        action: 'logout',
        description: 'User logged out of the system',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        metadata: {
          session_duration: 7200,
          logout_reason: 'user_initiated'
        },
        timestamp: new Date(Date.now() - 36000000) // 10 hours ago
      }
    ];

    await this.seedCollection('activitylogs', activityLogs, { clearFirst: false });
  }
}

module.exports = ActivityLogSeeder;