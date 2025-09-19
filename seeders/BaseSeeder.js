const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Base seeder class that provides common functionality for all seeders
 */
class BaseSeeder {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        this.connection = mongoose.connection;
        this.isConnected = true;
        return this.connection;
      }

      if (this.isConnected) {
        return this.connection;
      }

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';
      
      // Configure mongoose to prevent auto-creation
      mongoose.set('autoCreate', false);
      mongoose.set('autoIndex', false);
      
      this.connection = await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000, // Increased for Atlas
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000, // Added for Atlas
        retryWrites: true,
        w: 'majority',
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB for seeding');
      
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        this.connection = null;
        console.log('✅ Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  async clearCollection(collectionName) {
    try {
      await mongoose.connection.db.collection(collectionName).deleteMany({});
      console.log(`🗑️  Cleared collection: ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error clearing collection ${collectionName}:`, error.message);
      throw error;
    }
  }

  async seedCollection(collectionName, data, options = {}) {
    try {
      const collection = mongoose.connection.db.collection(collectionName);
      
      if (options.clearFirst) {
        await this.clearCollection(collectionName);
      }
      
      if (data.length > 0) {
        await collection.insertMany(data);
        console.log(`✅ Seeded ${data.length} records to ${collectionName}`);
      } else {
        console.log(`ℹ️  No data to seed for ${collectionName}`);
      }
    } catch (error) {
      console.error(`❌ Error seeding collection ${collectionName}:`, error.message);
      throw error;
    }
  }

  async getExistingCount(collectionName) {
    try {
      return await mongoose.connection.db.collection(collectionName).countDocuments();
    } catch (error) {
      return 0;
    }
  }

  async run() {
    try {
      await this.connect();
      console.log(`\n🌱 Running seeder: ${this.constructor.name}`);
      await this.seed();
      console.log(`✅ Completed seeder: ${this.constructor.name}`);
    } catch (error) {
      console.error(`❌ Seeder ${this.constructor.name} failed:`, error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // Abstract method to be implemented by subclasses
  async seed() {
    throw new Error('Seed method must be implemented by subclass');
  }
}

module.exports = BaseSeeder;