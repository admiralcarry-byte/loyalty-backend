const mongoose = require('mongoose');

/**
 * Sample migration: Add user preferences
 * This demonstrates how to add new fields to existing collections
 */
module.exports = {
  async up() {
    console.log('Adding user preferences fields...');
    
    const User = require('../schemas/User');
    
    try {
      // Add new fields to existing users
      await User.updateMany(
        { preferences: { $exists: false } },
        {
          $set: {
            preferences: {
              notifications: {
                email: true,
                sms: false,
                push: true
              },
              language: 'en',
              timezone: 'UTC'
            }
          }
        }
      );
      
      console.log('✅ Added preferences field to existing users');
      
      // Add new fields to existing users for enhanced security
      await User.updateMany(
        { 'security.two_factor_enabled': { $exists: false } },
        {
          $set: {
            'security.two_factor_enabled': false,
            'security.login_attempts': 0,
            'security.password_changed_at': new Date()
          }
        }
      );
      
      console.log('✅ Added enhanced security fields to existing users');
      
    } catch (error) {
      console.error('❌ Error adding user preferences:', error.message);
      throw error;
    }
    
    console.log('✅ User preferences migration completed successfully');
  },

  async down() {
    console.log('Rolling back user preferences migration...');
    
    const User = require('../schemas/User');
    
    try {
      // Remove the preferences field
      await User.updateMany(
        { preferences: { $exists: true } },
        { $unset: { preferences: 1 } }
      );
      
      console.log('✅ Removed preferences field from users');
      
      // Remove enhanced security fields
      await User.updateMany(
        { 'security.two_factor_enabled': { $exists: true } },
        {
          $unset: {
            'security.two_factor_enabled': 1,
            'security.login_attempts': 1,
            'security.password_changed_at': 1
          }
        }
      );
      
      console.log('✅ Removed enhanced security fields from users');
      
    } catch (error) {
      console.error('❌ Error rolling back user preferences:', error.message);
      throw error;
    }
    
    console.log('✅ User preferences migration rolled back successfully');
  }
};