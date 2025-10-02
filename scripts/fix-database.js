const mongoose = require('mongoose');
require('dotenv').config();

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database configuration...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);

    // Configure mongoose
    mongoose.set('autoCreate', false);
    mongoose.set('autoIndex', false);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Get database name from connection string
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Current database: ${dbName}`);

    // Check if this is the correct database
    if (dbName === 'aguatwezah_admin') {
      console.log('✅ Database name is correct: aguatwezah_admin');
      
      // Check if collections exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📋 Found ${collections.length} collections:`);
      collections.forEach(col => console.log(`   - ${col.name}`));
      
      if (collections.length === 0) {
        console.log('⚠️  No collections found. You need to run the seed script.');
        console.log('   Run: npm run seed');
      } else {
        console.log('✅ Database appears to be properly seeded');
      }
    } else {
      console.log(`❌ Wrong database name: ${dbName}`);
      console.log('   Expected: aguatwezah_admin');
      console.log('   This explains why the application cannot connect properly.');
      
      // Check if there's a test database
      const admin = mongoose.connection.db.admin();
      const dbs = await admin.listDatabases();
      const testDb = dbs.databases.find(db => db.name === 'test');
      
      if (testDb) {
        console.log('🔍 Found a "test" database. This might contain your seed data.');
        console.log('   You should either:');
        console.log('   1. Update your MONGODB_URI to point to the test database, or');
        console.log('   2. Copy data from test to aguatwezah_admin, or');
        console.log('   3. Re-seed the aguatwezah_admin database');
      }
    }

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the fix
fixDatabase();