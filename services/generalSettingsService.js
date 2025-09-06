const GeneralSettings = require('../models/GeneralSettings');
const Joi = require('joi');

// Validation schema for general settings
const generalSettingsSchema = Joi.object({
  app_name: Joi.string().max(100).required(),
  support_email: Joi.string().email().max(255).required(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'AOA', 'BRL', 'ZAR').required(),
  app_description: Joi.string().max(500).required(),
  timezone: Joi.string().max(100).required(),
  language: Joi.string().valid('Portuguese', 'English', 'Spanish', 'French').required()
}).unknown(false); // Reject unknown fields

class GeneralSettingsService {
  async getGeneralSettings() {
    try {
      const generalSettingsModel = new GeneralSettings();
      const settings = await generalSettingsModel.getCurrentSettings();
      
      return {
        success: true,
        data: settings
      };
    } catch (error) {
      console.error('Error fetching general settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateGeneralSettings(settingsData) {
    try {
      // Validate the input data
      const { error, value } = generalSettingsSchema.validate(settingsData);
      if (error) {
        console.error('Validation error:', error.details);
        return {
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        };
      }

      const generalSettingsModel = new GeneralSettings();
      const updatedSettings = await generalSettingsModel.updateSettings(value);
      
      return {
        success: true,
        data: updatedSettings,
        message: 'General settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating general settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeneralSettingsService();