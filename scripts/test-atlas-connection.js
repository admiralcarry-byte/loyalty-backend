const mongoose = require('mongoose');
require('dotenv').config();

// Your Atlas URI
const ATLAS_URI = 'mongodb+srv://admiralcarry_db_user:hRbz6MRdicUoyLZk@loyalty-cloud.k62anvl.mongodb.net/aguatwezah_admin';

async function testAtlasConnection() {
  try {
    console.log('🧪 Testing Atlas connection...');
    console.log(`📡 Connecting to: ${ATLAS_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Configure mongoose
    mongoose.set('autoCreate', false);
    mongoose.set('autoIndex', false);
    mongoose.set('bufferCommands', false);
    
    // Connect to Atlas
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log('✅ Successfully connected to Atlas!');
    
    // Get database info
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database name: ${dbName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Test a simple query
    if (collections.length > 0) {
      const firstCollection = collections[0].name;
      const count = await mongoose.connection.db.collection(firstCollection).countDocuments();
      console.log(`📈 Collection '${firstCollection}' has ${count} documents`);
    }
    
    console.log('\n🎉 Atlas connection test successful!');
    console.log('✅ Your database configuration is working correctly.');
    
  } catch (error) {
    console.error('❌ Atlas connection test failed:', error.message);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Check if your IP is whitelisted in Atlas');
    console.log('2. Verify your username and password are correct');
    console.log('3. Ensure the database name is correct');
    console.log('4. Check your network connection');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
}

// Run the test
testAtlasConnection();