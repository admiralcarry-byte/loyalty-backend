const GeneralSettings = require('../models/GeneralSettings');
const User = require('../models/User');
const Sale = require('../models/Sale');
const ActivityLog = require('../models/ActivityLog');
const Joi = require('joi');

// Validation schema for general settings
const generalSettingsSchema = Joi.object({
  app_name: Joi.string().max(100).required(),
  support_email: Joi.string().email().max(255).required(),
  currency: Joi.string().valid('AOA', 'USD', 'EUR', 'GBP', 'BRL', 'ZAR').required(),
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

  async getSettingsStatistics() {
    try {
      const userModel = new User();
      const saleModel = new Sale();
      const activityLogModel = new ActivityLog();

      // Get current month and last month dates
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Count active settings (general settings + other configs)
      const generalSettingsModel = new GeneralSettings();
      const settings = await generalSettingsModel.getCurrentSettings();
      const activeSettings = Object.keys(settings).length;

      // Count saved changes (activity logs related to settings changes)
      const savedChangesResult = await activityLogModel.findAll({
        action: { $regex: /settings|config|update/i },
        created_at: { $gte: lastMonth }
      });
      const savedChanges = savedChangesResult.length;

      // Calculate system status based on various factors
      const totalUsers = await userModel.count();
      const activeUsers = await userModel.count({ status: 'active' });
      const totalSales = await saleModel.count();
      const recentSales = await saleModel.count({
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });

      // Calculate system health percentage
      const userHealth = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 100;
      const salesHealth = totalSales > 0 ? Math.min((recentSales / totalSales) * 1000, 100) : 100; // Recent sales indicator
      const systemStatus = Math.round((userHealth + salesHealth) / 2);

      // Calculate growth percentages
      const lastMonthUsers = await userModel.count({
        created_at: { $gte: lastMonth, $lte: lastMonthEnd }
      });
      const currentMonthUsers = await userModel.count({
        created_at: { $gte: currentMonth }
      });
      const userGrowth = lastMonthUsers > 0 ? 
        ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      const lastMonthChanges = await activityLogModel.findAll({
        action: { $regex: /settings|config|update/i },
        created_at: { $gte: lastMonth, $lte: lastMonthEnd }
      });
      const changeGrowth = lastMonthChanges.length > 0 ? 
        ((savedChanges - lastMonthChanges.length) / lastMonthChanges.length) * 100 : 0;

      return {
        success: true,
        data: {
          activeSettings,
          savedChanges,
          systemStatus: Math.min(systemStatus, 100), // Cap at 100%
          userGrowth: Math.round(userGrowth * 10) / 10, // Round to 1 decimal
          changeGrowth: Math.round(changeGrowth * 10) / 10,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching settings statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeneralSettingsService();