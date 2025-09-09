const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Refresh Token seeder - Creates sample refresh tokens
 */
class RefreshTokenSeeder extends BaseSeeder {
  async seed() {
    console.log('🔄 Seeding refresh tokens...');
    
    const existingCount = await this.getExistingCount('refreshtokens');
    if (existingCount > 0) {
      console.log(`ℹ️  Refresh tokens collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping refresh tokens seeding - users collection is empty');
      return;
    }

    const refreshTokens = [];

    // Generate refresh tokens for users
    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const refreshToken = {
        user_id: randomUser._id,
        token: `refresh_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
        is_revoked: Math.random() > 0.8, // 20% chance of being revoked
        revoked_at: Math.random() > 0.8 ? new Date(Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000)) : null,
        device_info: {
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip_address: `192.168.1.${100 + i}`,
          device_type: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)]
        },
        created_at: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      };

      refreshTokens.push(refreshToken);
    }

    await this.seedCollection('refreshtokens', refreshTokens, { clearFirst: false });
  }
}

module.exports = RefreshTokenSeeder;