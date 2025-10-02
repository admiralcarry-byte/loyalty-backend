const CommissionSettings = require('../models/CommissionSettings');
const { validationResult } = require('express-validator');

const commissionSettingsModel = new CommissionSettings();

class CommissionSettingsController {
  // Get current commission settings
  async getCurrentSettings(req, res) {
    try {
      const settings = await commissionSettingsModel.model.getCurrentSettings();
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting commission settings:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create or update commission settings
  async saveSettings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        base_commission_rate,
        cashback_rate,
        tier_multipliers,
        minimum_active_users,
        payout_threshold,
        payout_frequency,
        auto_approval,
        commission_cap
      } = req.body;

      // Validate tier multipliers
      if (!tier_multipliers || 
          typeof tier_multipliers.lead !== 'number' ||
          typeof tier_multipliers.silver !== 'number' ||
          typeof tier_multipliers.gold !== 'number' ||
          typeof tier_multipliers.platinum !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier multipliers format'
        });
      }

      // For now, use a default user ID (in production, this would come from auth middleware)
      const userId = req.user?.id || '68bb087a6a0bf8200348e053'; // Default admin user ID

      const settingsData = {
        base_commission_rate: parseFloat(base_commission_rate),
        cashback_rate: parseFloat(cashback_rate),
        tier_multipliers: {
          lead: parseFloat(tier_multipliers.lead),
          silver: parseFloat(tier_multipliers.silver),
          gold: parseFloat(tier_multipliers.gold),
          platinum: parseFloat(tier_multipliers.platinum)
        },
        minimum_active_users: parseInt(minimum_active_users),
        payout_threshold: parseFloat(payout_threshold),
        payout_frequency,
        auto_approval: Boolean(auto_approval),
        commission_cap: parseFloat(commission_cap)
      };

      const updatedSettings = await commissionSettingsModel.model.updateCurrentSettings(settingsData, userId);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'Commission settings updated successfully'
      });
    } catch (error) {
      console.error('Error saving commission settings:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get settings history
  async getSettingsHistory(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const settings = await commissionSettingsModel.model
        .find()
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email')
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      const total = await commissionSettingsModel.model.countDocuments();

      res.json({
        success: true,
        data: settings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting settings history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Calculate commission for testing
  async calculateCommission(req, res) {
    try {
      const { tier, sales_amount } = req.body;

      if (!tier || !sales_amount) {
        return res.status(400).json({
          success: false,
          error: 'Tier and sales amount are required'
        });
      }

      const settings = await commissionSettingsModel.model.getCurrentSettings();
      const commission = settings.calculateCommission(tier, parseFloat(sales_amount));

      res.json({
        success: true,
        data: {
          tier,
          sales_amount: parseFloat(sales_amount),
          commission,
          base_rate: settings.base_commission_rate,
          tier_multiplier: settings.tier_multipliers[tier.toLowerCase()] || 1.0
        }
      });
    } catch (error) {
      console.error('Error calculating commission:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CommissionSettingsController();