#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Quick fix for MongoDB connection issues
 * This script will set up a local MongoDB connection for development
 */
function quickFixMongoDB() {
  console.log('🔧 Quick MongoDB Connection Fix\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  // Default local MongoDB connection
  const defaultMongoUri = 'mongodb://localhost:27017/aguatwezah_admin';
  
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Found existing .env file');
  } else {
    console.log('📄 Creating new .env file');
  }
  
  // Update or add MONGODB_URI
  if (envContent.includes('MONGODB_URI=')) {
    envContent = envContent.replace(/MONGODB_URI=.*/, `MONGODB_URI=${defaultMongoUri}`);
    console.log('✅ Updated MONGODB_URI in existing .env file');
  } else {
    envContent += `MONGODB_URI=${defaultMongoUri}\n`;
    console.log('✅ Added MONGODB_URI to .env file');
  }
  
  // Add other common environment variables if they don't exist
  if (!envContent.includes('PORT=')) {
    envContent += 'PORT=5000\n';
  }
  
  if (!envContent.includes('NODE_ENV=')) {
    envContent += 'NODE_ENV=development\n';
  }
  
  if (!envContent.includes('JWT_SECRET=')) {
    envContent += 'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production\n';
  }
  
  // Write the .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log(`\n✅ .env file configured with: ${defaultMongoUri}`);
  console.log('\n📋 Next steps:');
  console.log('1. Make sure MongoDB is running locally');
  console.log('2. If you don\'t have MongoDB installed, install it or use MongoDB Atlas');
  console.log('3. Run: npm run migrate');
  console.log('\n💡 Alternative connection options:');
  console.log('- For MongoDB Atlas: Update MONGODB_URI in .env with your Atlas connection string');
  console.log('- For Railway: Update MONGODB_URI in .env with your Railway connection string');
  console.log('- For Docker: Use mongodb://mongo:27017/aguatwezah_admin');
}

// Run the quick fix
quickFixMongoDB();