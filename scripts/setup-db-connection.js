#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Database connection setup script
 * Helps configure the correct MongoDB connection string
 */
async function setupDatabaseConnection() {
  console.log('🔧 Database Connection Setup\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  try {
    console.log('Choose your MongoDB setup:');
    console.log('1. Local MongoDB (localhost)');
    console.log('2. Railway MongoDB');
    console.log('3. MongoDB Atlas (cloud)');
    console.log('4. Custom connection string');
    
    const choice = await question('\nEnter your choice (1-4): ');
    
    let mongoUri = '';
    
    switch (choice) {
      case '1':
        mongoUri = 'mongodb://localhost:27017/aguatwezah_admin';
        console.log('✅ Using local MongoDB connection');
        break;
        
      case '2':
        const railwayHost = await question('Enter Railway MongoDB host (e.g., mongo.railway.internal): ');
        const railwayPort = await question('Enter Railway MongoDB port (default: 27017): ') || '27017';
        mongoUri = `mongodb://${railwayHost}:${railwayPort}/aguatwezah_admin`;
        console.log('✅ Using Railway MongoDB connection');
        break;
        
      case '3':
        const atlasUri = await question('Enter your MongoDB Atlas connection string: ');
        mongoUri = atlasUri;
        console.log('✅ Using MongoDB Atlas connection');
        break;
        
      case '4':
        mongoUri = await question('Enter your custom MongoDB connection string: ');
        console.log('✅ Using custom MongoDB connection');
        break;
        
      default:
        console.log('❌ Invalid choice. Using local MongoDB as default.');
        mongoUri = 'mongodb://localhost:27017/aguatwezah_admin';
    }

    // Create or update .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add MONGODB_URI
    if (envContent.includes('MONGODB_URI=')) {
      envContent = envContent.replace(/MONGODB_URI=.*/, `MONGODB_URI=${mongoUri}`);
    } else {
      envContent += `\nMONGODB_URI=${mongoUri}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Updated .env file with MongoDB URI: ${mongoUri}`);
    
    // Test the connection
    console.log('\n🧪 Testing MongoDB connection...');
    const mongoose = require('mongoose');
    
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ MongoDB connection successful!');
      await mongoose.disconnect();
    } catch (error) {
      console.log('❌ MongoDB connection failed:', error.message);
      console.log('\nTroubleshooting tips:');
      console.log('1. Make sure MongoDB is running');
      console.log('2. Check your connection string');
      console.log('3. Verify network connectivity');
      console.log('4. Check firewall settings');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

// Run setup
setupDatabaseConnection();