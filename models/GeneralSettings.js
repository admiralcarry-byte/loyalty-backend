const BaseModel = require('./BaseModel');
const GeneralSettingsSchema = require('../schemas/GeneralSettings');

class GeneralSettings extends BaseModel {
  constructor() {
    super(GeneralSettingsSchema);
  }

  // Get current active settings
  async getCurrentSettings() {
    try {
      return await GeneralSettingsSchema.getCurrentSettings();
    } catch (error) {
      console.error('Error in getCurrentSettings:', error);
      throw error;
    }
  }

  // Update settings
  async updateSettings(updateData) {
    try {
      return await GeneralSettingsSchema.updateSettings(updateData);
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  }
}

module.exports = GeneralSettings;