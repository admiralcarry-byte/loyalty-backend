#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Create .env file with proper configuration for ÁGUA TWEZAH Admin System
 */
function createEnvFile() {
  console.log('🔧 Creating .env file for ÁGUA TWEZAH Admin System...\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  const envContent = `# MongoDB Configuration
# For local development, use:
MONGODB_URI=mongodb://localhost:27017/aguatwezah_admin

# For Railway deployment, use your Railway MongoDB connection string:
# MONGODB_URI=mongodb://mongo:27017/aguatwezah_admin

# For MongoDB Atlas (cloud), use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aguatwezah_admin

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=aguatwezah-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRE=7d

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# API Configuration
API_PREFIX=/api/v1

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
# For local development:
CORS_ORIGIN=http://localhost:3000
# For production with Netlify frontend:
# CORS_ORIGIN=https://loyalty-frontend.netlify.app
# For multiple origins (comma-separated):
# CORS_ORIGIN=http://localhost:3000,https://loyalty-frontend.netlify.app

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=aguatwezah-session-secret-change-this-in-production

# Business Configuration
DEFAULT_CURRENCY=USD
DEFAULT_TIMEZONE=Africa/Luanda
DEFAULT_LANGUAGE=Portuguese

# Points Configuration
POINTS_PER_DOLLAR=10
POINTS_EXPIRY_DAYS=365
CASHBACK_DEFAULT_PERCENTAGE=5

# Commission Configuration
DEFAULT_COMMISSION_RATE=5
INFLUENCER_COMMISSION_RATE=10

# Notification Configuration
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_PUSH_NOTIFICATIONS=true

# Development/Testing
ENABLE_DEBUG_LOGS=true
SKIP_AUTH_IN_DEV=false
`;

  try {
    // Check if .env file already exists
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env file already exists!');
      console.log('📄 Current .env file location:', envPath);
      console.log('\n💡 To update your .env file:');
      console.log('   1. Backup your current .env file');
      console.log('   2. Delete the existing .env file');
      console.log('   3. Run this script again');
      console.log('\n📋 Or manually update your .env file with the following content:');
      console.log('=' * 50);
      console.log(envContent);
      console.log('=' * 50);
      return;
    }

    // Create the .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env file created successfully!');
    console.log('📄 Location:', envPath);
    console.log('\n📋 Configuration includes:');
    console.log('   - MongoDB connection (local development)');
    console.log('   - JWT authentication settings');
    console.log('   - Server configuration');
    console.log('   - Business settings for ÁGUA TWEZAH');
    console.log('   - Points and commission configuration');
    console.log('   - Notification settings');
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Review and update the .env file as needed');
    console.log('   2. For production, change JWT_SECRET and SESSION_SECRET');
    console.log('   3. Update MongoDB URI for your environment');
    console.log('   4. Configure email settings if needed');
    
    console.log('\n🚀 You can now run:');
    console.log('   npm run fix-mongodb  # Fix MongoDB connection');
    console.log('   npm run setup-complete  # Complete database setup');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('\n📋 Manual creation:');
    console.log('Create a file named ".env" in the backend directory with this content:');
    console.log('=' * 50);
    console.log(envContent);
    console.log('=' * 50);
  }
}

// Run the script
createEnvFile();