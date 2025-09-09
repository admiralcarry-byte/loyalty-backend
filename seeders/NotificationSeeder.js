const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Notification seeder - Creates sample notifications
 */
class NotificationSeeder extends BaseSeeder {
  async seed() {
    console.log('🔔 Seeding notifications...');
    
    const existingCount = await this.getExistingCount('notifications');
    if (existingCount > 0) {
      console.log(`ℹ️  Notifications collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping notifications seeding - users collection are empty');
      return;
    }

    const notifications = [
      {
        user_id: users[0]._id,
        title: 'Welcome to ÁGUA TWEZAH!',
        message: 'Thank you for joining our loyalty program. Start earning points with your first purchase!',
        type: 'welcome',
        priority: 'medium',
        status: 'unread',
        is_read: false,
        read_at: null,
        action_url: '/dashboard',
        action_text: 'View Dashboard',
        metadata: {
          campaign_id: 'welcome_campaign_2024',
          points_bonus: 100
        },
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
        created_at: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        user_id: users[1]._id,
        title: 'Order Confirmed',
        message: 'Your order #12345 has been confirmed and is being prepared for delivery.',
        type: 'order_update',
        priority: 'high',
        status: 'read',
        is_read: true,
        read_at: new Date(Date.now() - 1800000), // 30 minutes ago
        action_url: '/orders/12345',
        action_text: 'Track Order',
        metadata: {
          order_id: '12345',
          estimated_delivery: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000))
        },
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
        created_at: new Date(Date.now() - 7200000) // 2 hours ago
      },
      {
        user_id: users[2]._id,
        title: 'Points Expiring Soon',
        message: 'You have 250 points that will expire in 7 days. Use them now to get discounts!',
        type: 'points_reminder',
        priority: 'high',
        status: 'unread',
        is_read: false,
        read_at: null,
        action_url: '/rewards',
        action_text: 'Redeem Points',
        metadata: {
          expiring_points: 250,
          expiration_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        },
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
        created_at: new Date(Date.now() - 10800000) // 3 hours ago
      },
      {
        user_id: users[3]._id,
        title: 'New Campaign Available',
        message: 'Check out our Summer Hydration campaign and earn double points on all purchases!',
        type: 'campaign',
        priority: 'medium',
        status: 'unread',
        is_read: false,
        read_at: null,
        action_url: '/campaigns/summer-hydration',
        action_text: 'View Campaign',
        metadata: {
          campaign_id: 'summer_hydration_2024',
          points_multiplier: 2.0,
          discount_percentage: 15
        },
        expires_at: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)), // 14 days from now
        created_at: new Date(Date.now() - 14400000) // 4 hours ago
      },
      {
        user_id: users[4]._id,
        title: 'Loyalty Tier Upgrade',
        message: 'Congratulations! You have been upgraded to Gold tier. Enjoy exclusive benefits!',
        type: 'tier_upgrade',
        priority: 'high',
        status: 'read',
        is_read: true,
        read_at: new Date(Date.now() - 900000), // 15 minutes ago
        action_url: '/loyalty',
        action_text: 'View Benefits',
        metadata: {
          new_tier: 'gold',
          previous_tier: 'silver',
          new_benefits: ['free_delivery', 'priority_support', 'exclusive_products']
        },
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
        created_at: new Date(Date.now() - 18000000) // 5 hours ago
      },
      {
        user_id: users[0]._id,
        title: 'Payment Failed',
        message: 'Your payment for order #12346 could not be processed. Please update your payment method.',
        type: 'payment_issue',
        priority: 'high',
        status: 'unread',
        is_read: false,
        read_at: null,
        action_url: '/payment/update',
        action_text: 'Update Payment',
        metadata: {
          order_id: '12346',
          payment_method: 'credit_card',
          failure_reason: 'insufficient_funds'
        },
        expires_at: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 days from now
        created_at: new Date(Date.now() - 21600000) // 6 hours ago
      },
      {
        user_id: users[1]._id,
        title: 'Referral Bonus Earned',
        message: 'You earned 50 bonus points for referring a friend! Keep sharing to earn more rewards.',
        type: 'referral_bonus',
        priority: 'medium',
        status: 'read',
        is_read: true,
        read_at: new Date(Date.now() - 600000), // 10 minutes ago
        action_url: '/referrals',
        action_text: 'View Referrals',
        metadata: {
          bonus_points: 50,
          referred_user: 'friend@example.com',
          referral_code: 'REF123456'
        },
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
        created_at: new Date(Date.now() - 25200000) // 7 hours ago
      },
      {
        user_id: users[2]._id,
        title: 'Delivery Scheduled',
        message: 'Your order will be delivered tomorrow between 2:00 PM and 4:00 PM.',
        type: 'delivery_update',
        priority: 'medium',
        status: 'unread',
        is_read: false,
        read_at: null,
        action_url: '/orders/12347',
        action_text: 'Track Delivery',
        metadata: {
          order_id: '12347',
          delivery_date: new Date(Date.now() + (24 * 60 * 60 * 1000)),
          time_slot: '14:00-16:00',
          delivery_address: 'Rua Amílcar Cabral, 123, Luanda'
        },
        expires_at: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)), // 2 days from now
        created_at: new Date(Date.now() - 28800000) // 8 hours ago
      },
      {
        user_id: users[3]._id,
        title: 'Birthday Special Offer',
        message: 'Happy Birthday! Enjoy 20% off your next purchase with code BIRTHDAY20.',
        type: 'birthday_offer',
        priority: 'high',
        status: 'unread',
        is_read: false,
        read_at: null,
        action_url: '/offers/birthday',
        action_text: 'Use Offer',
        metadata: {
          discount_code: 'BIRTHDAY20',
          discount_percentage: 20,
          valid_until: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        },
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
        created_at: new Date(Date.now() - 32400000) // 9 hours ago
      },
      {
        user_id: users[4]._id,
        title: 'System Maintenance Notice',
        message: 'Our system will be under maintenance on Sunday from 2:00 AM to 4:00 AM. Some features may be unavailable.',
        type: 'system_announcement',
        priority: 'low',
        status: 'read',
        is_read: true,
        read_at: new Date(Date.now() - 300000), // 5 minutes ago
        action_url: '/status',
        action_text: 'View Status',
        metadata: {
          maintenance_date: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)),
          start_time: '02:00',
          end_time: '04:00',
          affected_services: ['mobile_app', 'online_ordering']
        },
        expires_at: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 days from now
        created_at: new Date(Date.now() - 36000000) // 10 hours ago
      }
    ];

    await this.seedCollection('notifications', notifications, { clearFirst: false });
  }
}

module.exports = NotificationSeeder;