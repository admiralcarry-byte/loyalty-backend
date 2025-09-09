const mongoose = require('mongoose');
require('dotenv').config();

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ Already connected to MongoDB');
        return this.connection;
      }

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';
      
      console.log('🚀 Connecting to MongoDB...');
      console.log('📍 Connection URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
      
      // Enhanced connection options for Atlas
      const connectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000, // Increased for Atlas
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000, // Increased for Atlas
        retryWrites: true,
        w: 'majority',
      };
      
      this.connection = await mongoose.connect(mongoUri, connectionOptions);

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = false;
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
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

  async testConnection() {
    try {
      await this.connect();
      const admin = mongoose.connection.db.admin();
      const result = await admin.ping();
      console.log('✅ MongoDB connection test successful:', result);
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection test failed:', error);
      return false;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnectedToDB() {
    return this.isConnected;
  }
}

// Create and export a singleton instance
const database = new Database();

module.exports = database; 