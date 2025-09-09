const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname);
    this.migrationCollection = 'migrations';
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aguatwezah_admin';
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB for migrations');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  async getMigrationCollection() {
    return mongoose.connection.db.collection(this.migrationCollection);
  }

  async getExecutedMigrations() {
    try {
      const collection = await this.getMigrationCollection();
      const migrations = await collection.find({}).sort({ timestamp: 1 }).toArray();
      return migrations.map(m => m.name);
    } catch (error) {
      // If collection doesn't exist, return empty array
      return [];
    }
  }

  async markMigrationAsExecuted(migrationName, success = true) {
    try {
      const collection = await this.getMigrationCollection();
      await collection.insertOne({
        name: migrationName,
        timestamp: new Date(),
        success: success
      });
    } catch (error) {
      console.error(`Error marking migration ${migrationName} as executed:`, error);
      throw error;
    }
  }

  async getAvailableMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.js') && file !== 'migrationRunner.js')
        .sort();
      
      return files.map(file => ({
        name: file,
        path: path.join(this.migrationsPath, file)
      }));
    } catch (error) {
      console.error('Error reading migration files:', error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      await this.connect();
      
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      const pendingMigrations = availableMigrations.filter(
        migration => !executedMigrations.includes(migration.name)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations found');
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach(m => console.log(`  - ${m.name}`));

      for (const migration of pendingMigrations) {
        console.log(`\nRunning migration: ${migration.name}`);
        
        try {
          // Clear require cache to ensure fresh module load
          delete require.cache[require.resolve(migration.path)];
          const migrationModule = require(migration.path);
          
          if (typeof migrationModule.up === 'function') {
            await migrationModule.up();
            await this.markMigrationAsExecuted(migration.name, true);
            console.log(`✅ Migration ${migration.name} completed successfully`);
          } else {
            throw new Error(`Migration ${migration.name} does not export an 'up' function`);
          }
        } catch (error) {
          console.error(`❌ Migration ${migration.name} failed:`, error);
          await this.markMigrationAsExecuted(migration.name, false);
          throw error;
        }
      }

      console.log('\n✅ All migrations completed successfully');
      
      // Automatically run seeding after successful migrations
      console.log('\n🌱 Running automatic database seeding...');
      await this.runSeeding();
      
    } catch (error) {
      console.error('Migration process failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async rollbackMigration(migrationName) {
    try {
      await this.connect();
      
      const migrationPath = path.join(this.migrationsPath, migrationName);
      
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file ${migrationName} not found`);
      }

      console.log(`Rolling back migration: ${migrationName}`);
      
      // Clear require cache
      delete require.cache[require.resolve(migrationPath)];
      const migrationModule = require(migrationPath);
      
      if (typeof migrationModule.down === 'function') {
        await migrationModule.down();
        
        // Remove from executed migrations
        const collection = await this.getMigrationCollection();
        await collection.deleteOne({ name: migrationName });
        
        console.log(`✅ Migration ${migrationName} rolled back successfully`);
      } else {
        throw new Error(`Migration ${migrationName} does not export a 'down' function`);
      }
    } catch (error) {
      console.error(`❌ Rollback of ${migrationName} failed:`, error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async getMigrationStatus() {
    try {
      await this.connect();
      
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      console.log('\nMigration Status:');
      console.log('================');
      
      availableMigrations.forEach(migration => {
        const isExecuted = executedMigrations.includes(migration.name);
        const status = isExecuted ? '✅ Executed' : '⏳ Pending';
        console.log(`${status} - ${migration.name}`);
      });
      
      console.log(`\nTotal: ${availableMigrations.length} migrations`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${availableMigrations.length - executedMigrations.length}`);
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async resetDatabase() {
    try {
      await this.connect();
      
      console.log('⚠️  WARNING: This will delete ALL data from the database!');
      console.log('This action cannot be undone.');
      
      // Get all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      console.log(`\nFound ${collections.length} collections to drop:`);
      collections.forEach(col => console.log(`  - ${col.name}`));
      
      // Drop all collections
      for (const collection of collections) {
        await mongoose.connection.db.collection(collection.name).drop();
        console.log(`✅ Dropped collection: ${collection.name}`);
      }
      
      console.log('\n✅ Database reset completed');
      console.log('All data has been deleted from the database');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async runSeeding() {
    try {
      // Import and run the SeederRunner
      const SeederRunner = require('../seeders/SeederRunner');
      const seederRunner = new SeederRunner();
      
      // Run seeding without the connection management (since we're already connected)
      await seederRunner.runSeeders();
      
      console.log('✅ Automatic seeding completed successfully');
    } catch (error) {
      console.error('❌ Automatic seeding failed:', error.message);
      // Don't throw error here - seeding failure shouldn't break migrations
      console.log('ℹ️  You can run seeding manually later with: npm run seed');
    }
  }
}

module.exports = MigrationRunner;