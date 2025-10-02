const mongoose = require('mongoose');

const generalSettingsSchema = new mongoose.Schema({
  app_name: {
    type: String,
    required: true,
    default: 'ÁGUA TWEZAH',
    maxlength: 100
  },
  support_email: {
    type: String,
    required: true,
    default: 'support@aguatwezah.com',
    maxlength: 255
  },
  currency: {
    type: String,
    required: true,
    default: 'AOA',
    enum: ['AOA', 'USD', 'EUR', 'GBP', 'BRL', 'ZAR']
  },
  app_description: {
    type: String,
    required: true,
    default: 'Premium Water Loyalty Program',
    maxlength: 500
  },
  timezone: {
    type: String,
    required: true,
    default: 'Africa/Luanda',
    maxlength: 100
  },
  language: {
    type: String,
    required: true,
    default: 'Portuguese',
    enum: ['Portuguese', 'English', 'Spanish', 'French']
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'general_settings'
});

// Ensure only one settings document exists
generalSettingsSchema.index({ is_active: 1 }, { unique: true, partialFilterExpression: { is_active: true } });

// Static method to get current settings
generalSettingsSchema.statics.getCurrentSettings = async function() {
  try {
    let settings = await this.findOne({ is_active: true });
    
    if (!settings) {
      // Create default settings if none exist
      settings = new this({
        app_name: 'ÁGUA TWEZAH',
        support_email: 'support@aguatwezah.com',
        currency: 'AOA',
        app_description: 'Premium Water Loyalty Program',
        timezone: 'Africa/Luanda',
        language: 'Portuguese',
        is_active: true
      });
      await settings.save();
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting current settings:', error);
    throw error;
  }
};

// Static method to update settings
generalSettingsSchema.statics.updateSettings = async function(updateData) {
  try {
    let settings = await this.findOne({ is_active: true });
    
    if (!settings) {
      // Create new settings if none exist
      settings = new this({
        ...updateData,
        is_active: true
      });
    } else {
      // Update existing settings
      Object.assign(settings, updateData);
    }
    
    await settings.save();
    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

module.exports = mongoose.model('GeneralSettings', generalSettingsSchema);