const mongoose = require('mongoose');
require('dotenv').config();

// Import the TierRequirement seeder
const TierRequirementSeeder = require('../seeders/TierRequirementSeeder');

async function runMigration() {
  try {
    console.log('🚀 Starting tier requirements migration...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agua_twezah';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Run the tier requirements seeder
    const seeder = new TierRequirementSeeder();
    await seeder.seed();
    
    console.log('✅ Tier requirements migration completed successfully');
  } catch (error) {
    console.error('❌ Tier requirements migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration;