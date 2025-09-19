const mongoose = require('mongoose');
require('dotenv').config();

async function testCollections() {
  try {
    console.log('🔍 Testing database collections...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📍 Database:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📊 Collections in database:');
    console.log('=' * 40);
    
    if (collections.length === 0) {
      console.log('❌ No collections found - database is empty');
      console.log('💡 Run: npm run seed');
    } else {
      collections.forEach((col, index) => {
        console.log(`${index + 1}. ${col.name}`);
      });
      
      console.log('\n📈 Summary:');
      console.log(`   Total collections: ${collections.length}`);
      
      // Check for expected collections
      const expectedCollections = [
        'commissions',
        'sales', 
        'stores',
        'users',
        'products',
        'influencerlevels',
        'loyaltylevels'
      ];
      
      const foundCollections = collections.map(c => c.name);
      const missingCollections = expectedCollections.filter(c => !foundCollections.includes(c));
      const extraCollections = foundCollections.filter(c => !expectedCollections.includes(c));
      
      if (missingCollections.length === 0 && extraCollections.length === 0) {
        console.log('✅ Perfect! Only expected collections found');
        console.log('✅ No extra collections created');
      } else {
        if (missingCollections.length > 0) {
          console.log('⚠️  Missing expected collections:', missingCollections.join(', '));
        }
        if (extraCollections.length > 0) {
          console.log('❌ Extra collections found:', extraCollections.join(', '));
          console.log('   This indicates the auto-creation fix may not be working');
        }
      }
      
      // Check admin user
      console.log('\n👤 Checking admin user...');
      const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      const adminUser = await User.findOne({ email: 'admin@aguatwezah.com' });
      
      if (adminUser) {
        console.log('✅ Admin user found');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Status: ${adminUser.status}`);
      } else {
        console.log('❌ Admin user not found');
        console.log('💡 Run: npm run seed');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testCollections();