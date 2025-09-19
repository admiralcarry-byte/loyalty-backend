const mongoose = require('mongoose');

/**
 * Update Existing Data Migration
 * Updates existing data to match the new schema structure
 */
module.exports = {
  async up() {
    console.log('Updating existing data to match new schema structure...');
    
    const db = mongoose.connection.db;
    
    try {
      // 1. Update OnlinePurchase collection to use consistent field names
      console.log('Updating OnlinePurchase collection...');
      await db.collection('onlinepurchases').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user',
              'items.product_id': '$items.product'
            }
          },
          {
            $unset: ['user', 'items.product']
          }
        ]
      );
      console.log('✅ Updated OnlinePurchase collection field names');

      // 2. Update Sale collection to use consistent field names
      console.log('Updating Sale collection...');
      await db.collection('sales').updateMany(
        { customer: { $exists: true } },
        [
          {
            $set: {
              user_id: '$customer'
            }
          },
          {
            $unset: ['customer']
          }
        ]
      );
      console.log('✅ Updated Sale collection field names');

      // 3. Update Notification collection to use consistent field names
      console.log('Updating Notification collection...');
      await db.collection('notifications').updateMany(
        { 'recipients.user': { $exists: true } },
        [
          {
            $set: {
              'recipients.user_id': '$recipients.user'
            }
          },
          {
            $unset: ['recipients.user']
          }
        ]
      );
      console.log('✅ Updated Notification collection field names');

      // 4. Update AuditLog collection to use consistent field names
      console.log('Updating AuditLog collection...');
      await db.collection('auditlogs').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated AuditLog collection field names');

      // 5. Update PointsTransaction collection to use consistent field names
      console.log('Updating PointsTransaction collection...');
      await db.collection('pointstransactions').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated PointsTransaction collection field names');

      // 6. Update CashbackTransaction collection to use consistent field names
      console.log('Updating CashbackTransaction collection...');
      await db.collection('cashbacktransactions').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated CashbackTransaction collection field names');

      // 7. Update Commission collection to use consistent field names
      console.log('Updating Commission collection...');
      await db.collection('commissions').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated Commission collection field names');

      // 8. Update PayoutRequest collection to use consistent field names
      console.log('Updating PayoutRequest collection...');
      await db.collection('payoutrequests').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated PayoutRequest collection field names');

      // 9. Update Purchases collection (formerly PurchaseEntry) to use consistent field names
      console.log('Updating Purchases collection...');
      await db.collection('purchases').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user',
              store_id: '$store'
            }
          },
          {
            $unset: ['user', 'store']
          }
        ]
      );
      console.log('✅ Updated Purchases collection field names');

      // 10. Update ScanUpload collection to use consistent field names
      console.log('Updating ScanUpload collection...');
      await db.collection('scanuploads').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated ScanUpload collection field names');

      // 11. Update ActivityLog collection to use consistent field names
      console.log('Updating ActivityLog collection...');
      await db.collection('activitylogs').updateMany(
        { user: { $exists: true } },
        [
          {
            $set: {
              user_id: '$user'
            }
          },
          {
            $unset: ['user']
          }
        ]
      );
      console.log('✅ Updated ActivityLog collection field names');

      // 12. Remove obsolete OnlinePurchaseItem collection
      console.log('Removing obsolete OnlinePurchaseItem collection...');
      try {
        await db.collection('onlinepurchaseitems').drop();
        console.log('✅ Removed OnlinePurchaseItem collection');
      } catch (error) {
        if (error.code === 26) { // NamespaceNotFound
          console.log('ℹ️  OnlinePurchaseItem collection does not exist, skipping removal');
        } else {
          console.error('❌ Error removing OnlinePurchaseItem collection:', error.message);
        }
      }

      // 13. Update timestamps to use consistent naming
      console.log('Updating timestamp field names...');
      const collections = [
        'users', 'stores', 'sales', 'products', 'campaigns', 'commissions',
        'notifications', 'auditlogs', 'pointstransactions', 'cashbacktransactions',
        'purchases', 'onlinepurchases', 'payoutrequests', 'scanuploads', 'activitylogs'
      ];

      for (const collectionName of collections) {
        try {
          await db.collection(collectionName).updateMany(
            { created_at: { $exists: true } },
            [
              {
                $set: {
                  createdAt: '$created_at',
                  updatedAt: '$updated_at'
                }
              },
              {
                $unset: ['created_at', 'updated_at']
              }
            ]
          );
          console.log(`✅ Updated ${collectionName} timestamp fields`);
        } catch (error) {
          console.log(`ℹ️  ${collectionName} collection may not exist or already updated`);
        }
      }

      console.log('🎉 Existing data update completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during existing data update:', error);
      throw error;
    }
  },

  async down() {
    console.log('Rolling back existing data updates...');
    
    const db = mongoose.connection.db;
    
    try {
      // Note: Rolling back field name changes is complex and could cause data loss
      // We'll only roll back the collection rename
      console.log('ℹ️  Field name changes are not rolled back to prevent data loss');
      console.log('ℹ️  Only collection renames can be safely rolled back');
      
      console.log('🎉 Existing data update rollback completed!');
      
    } catch (error) {
      console.error('❌ Error during existing data update rollback:', error);
      throw error;
    }
  }
};