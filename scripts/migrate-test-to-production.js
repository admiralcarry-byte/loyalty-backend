const mongoose = require('mongoose');
require('dotenv').config();

// Database configurations
const PRODUCTION_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';

// For Atlas, we need to construct the test URI properly
const getTestUri = () => {
  if (process.env.MONGODB_URI) {
    // Handle both local and Atlas URIs
    if (process.env.MONGODB_URI.includes('mongodb+srv://')) {
      // Atlas URI: replace the database name at the end
      return process.env.MONGODB_URI.replace(/\/[^\/]*$/, '/test');
    } else {
      // Local URI: replace the database name
      return process.env.MONGODB_URI.replace('/aguatwezah_admin', '/test');
    }
  }
  return 'mongodb://localhost:27017/test';
};

const TEST_URI = getTestUri();

async function migrateData() {
  let productionConnection, testConnection;
  
  try {
    console.log('🔄 Migrating data from test database to production database...');
    
    // Connect to test database
    console.log(`📡 Connecting to test database: ${TEST_URI}`);
    testConnection = await mongoose.createConnection(TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to test database');

    // Connect to production database
    console.log(`📡 Connecting to production database: ${PRODUCTION_URI}`);
    productionConnection = await mongoose.createConnection(PRODUCTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to production database');

    // Get collections from test database
    const testCollections = await testConnection.db.listCollections().toArray();
    console.log(`📋 Found ${testCollections.length} collections in test database:`);
    testCollections.forEach(col => console.log(`   - ${col.name}`));

    if (testCollections.length === 0) {
      console.log('⚠️  No collections found in test database. Nothing to migrate.');
      return;
    }

    // Migrate each collection
    for (const collection of testCollections) {
      const collectionName = collection.name;
      console.log(`\n🔄 Migrating collection: ${collectionName}`);
      
      try {
        // Get all documents from test collection
        const testCollection = testConnection.db.collection(collectionName);
        const documents = await testCollection.find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
          continue;
        }

        // Clear existing data in production collection
        const productionCollection = productionConnection.db.collection(collectionName);
        await productionCollection.deleteMany({});
        console.log(`   🗑️  Cleared existing data in ${collectionName}`);

        // Insert documents into production collection
        await productionCollection.insertMany(documents);
        console.log(`   ✅ Migrated ${documents.length} documents to ${collectionName}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate collection ${collectionName}:`, error.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('🔑 Admin login credentials:');
    console.log('   Email: admin@aguatwezah.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (testConnection) {
      await testConnection.close();
      console.log('🔌 Test database connection closed');
    }
    if (productionConnection) {
      await productionConnection.close();
      console.log('🔌 Production database connection closed');
    }
    process.exit(0);
  }
}

// Run the migration
migrateData();