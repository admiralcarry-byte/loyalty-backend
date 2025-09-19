const mongoose = require('mongoose');

/**
 * API Schema Alignment Migration
 * Aligns database collections and fields with the corrected API structure
 */
module.exports = {
  async up() {
    console.log('Aligning database schema with corrected API structure...');
    
    const db = mongoose.connection.db;
    
    try {
      // 1. Rename PurchaseEntry collection to Purchases to match API
      console.log('Renaming PurchaseEntry collection to Purchases...');
      try {
        await db.collection('purchaseentries').rename('purchases');
        console.log('✅ Renamed purchaseentries to purchases');
      } catch (error) {
        if (error.code === 26) { // NamespaceNotFound
          console.log('ℹ️  PurchaseEntry collection does not exist, skipping rename');
        } else {
          console.error('❌ Error renaming PurchaseEntry collection:', error.message);
        }
      }

      // 2. Update field names to be consistent across all collections
      console.log('Updating field names for consistency...');
      
      // Update User collection - ensure consistent field names
      await db.collection('users').updateMany(
        {},
        {
          $rename: {
            'user_id': 'id', // Ensure id field exists
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated User collection field names');

      // Update Store collection
      await db.collection('stores').updateMany(
        {},
        {
          $rename: {
            'store_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Store collection field names');

      // Update Sale collection
      await db.collection('sales').updateMany(
        {},
        {
          $rename: {
            'sale_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Sale collection field names');

      // Update Product collection
      await db.collection('products').updateMany(
        {},
        {
          $rename: {
            'product_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Product collection field names');

      // Update Campaign collection
      await db.collection('campaigns').updateMany(
        {},
        {
          $rename: {
            'campaign_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Campaign collection field names');

      // Update Commission collection
      await db.collection('commissions').updateMany(
        {},
        {
          $rename: {
            'commission_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Commission collection field names');

      // Update Notification collection
      await db.collection('notifications').updateMany(
        {},
        {
          $rename: {
            'notification_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Notification collection field names');

      // Update PayoutRequest collection
      await db.collection('payoutrequests').updateMany(
        {},
        {
          $rename: {
            'payout_request_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated PayoutRequest collection field names');

      // Update OnlinePurchase collection
      await db.collection('onlinepurchases').updateMany(
        {},
        {
          $rename: {
            'order_id': 'id',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated OnlinePurchase collection field names');

      // Update Purchases collection (formerly PurchaseEntry)
      await db.collection('purchases').updateMany(
        {},
        {
          $rename: {
            'entry_id': 'id',
            'entry_number': 'purchase_number',
            'entry_date': 'purchase_date',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
          }
        }
      );
      console.log('✅ Updated Purchases collection field names');

      // 3. Indexes are already created by the initial schema migration
      console.log('Indexes already created by initial schema migration, skipping...');

      console.log('🎉 Database schema alignment completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during schema alignment:', error);
      throw error;
    }
  },

  async down() {
    console.log('Rolling back API schema alignment...');
    
    const db = mongoose.connection.db;
    
    try {
      // Rename Purchases collection back to PurchaseEntry
      console.log('Renaming Purchases collection back to PurchaseEntry...');
      try {
        await db.collection('purchases').rename('purchaseentries');
        console.log('✅ Renamed purchases back to purchaseentries');
      } catch (error) {
        if (error.code === 26) { // NamespaceNotFound
          console.log('ℹ️  Purchases collection does not exist, skipping rename');
        } else {
          console.error('❌ Error renaming Purchases collection:', error.message);
        }
      }

      // Note: Field name changes are not rolled back as they are generally improvements
      // and rolling them back could cause data loss or inconsistencies
      console.log('ℹ️  Field name changes are not rolled back to prevent data loss');
      
      console.log('🎉 Schema alignment rollback completed!');
      
    } catch (error) {
      console.error('❌ Error during schema alignment rollback:', error);
      throw error;
    }
  }
};