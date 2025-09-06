const CommissionRule = require('../models/CommissionRule');
const { validationResult } = require('express-validator');

const commissionRuleModel = new CommissionRule();

class CommissionRuleController {
  // Get all commission rules
  async getAllRules(req, res) {
    try {
      const { active_only = false } = req.query;
      
      let rules;
      if (active_only === 'true') {
        rules = await commissionRuleModel.model.getActiveRules();
      } else {
        rules = await commissionRuleModel.model.getAllRules();
      }
      
      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error getting commission rules:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get commission rule by ID
  async getRuleById(req, res) {
    try {
      const { id } = req.params;
      
      const rule = await commissionRuleModel.model
        .findById(id)
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email');
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Commission rule not found'
        });
      }
      
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      console.error('Error getting commission rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new commission rule
  async createRule(req, res) {
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
        name,
        description,
        rate,
        type,
        priority = 0,
        conditions = {}
      } = req.body;

      // For now, use a default user ID (in production, this would come from auth middleware)
      const userId = req.user?.id || '68bb087a6a0bf8200348e053'; // Default admin user ID

      const ruleData = {
        name: name.trim(),
        description: description.trim(),
        rate: parseFloat(rate),
        type,
        priority: parseInt(priority),
        conditions: {
          minimum_sales: conditions.minimum_sales || 0,
          minimum_users: conditions.minimum_users || 0,
          minimum_growth: conditions.minimum_growth || 0,
          tier_restrictions: conditions.tier_restrictions || []
        },
        created_by: userId,
        updated_by: userId
      };

      const newRule = new commissionRuleModel.model(ruleData);
      await newRule.save();
      
      // Populate the created rule
      await newRule.populate('created_by', 'first_name last_name email');
      
      res.status(201).json({
        success: true,
        data: newRule,
        message: 'Commission rule created successfully'
      });
    } catch (error) {
      console.error('Error creating commission rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update commission rule
  async updateRule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const {
        name,
        description,
        rate,
        type,
        is_active,
        priority,
        conditions
      } = req.body;

      // For now, use a default user ID (in production, this would come from auth middleware)
      const userId = req.user?.id || '68bb087a6a0bf8200348e053';

      const updateData = {
        updated_by: userId
      };

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (rate !== undefined) updateData.rate = parseFloat(rate);
      if (type !== undefined) updateData.type = type;
      if (is_active !== undefined) updateData.is_active = Boolean(is_active);
      if (priority !== undefined) updateData.priority = parseInt(priority);
      if (conditions !== undefined) {
        updateData.conditions = {
          minimum_sales: conditions.minimum_sales || 0,
          minimum_users: conditions.minimum_users || 0,
          minimum_growth: conditions.minimum_growth || 0,
          tier_restrictions: conditions.tier_restrictions || []
        };
      }

      const updatedRule = await commissionRuleModel.model
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email');

      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          error: 'Commission rule not found'
        });
      }

      res.json({
        success: true,
        data: updatedRule,
        message: 'Commission rule updated successfully'
      });
    } catch (error) {
      console.error('Error updating commission rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete commission rule
  async deleteRule(req, res) {
    try {
      const { id } = req.params;

      const deletedRule = await commissionRuleModel.model.findByIdAndDelete(id);

      if (!deletedRule) {
        return res.status(404).json({
          success: false,
          error: 'Commission rule not found'
        });
      }

      res.json({
        success: true,
        message: 'Commission rule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting commission rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Toggle rule active status
  async toggleRuleStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      // For now, use a default user ID (in production, this would come from auth middleware)
      const userId = req.user?.id || '68bb087a6a0bf8200348e053';

      const updatedRule = await commissionRuleModel.model
        .findByIdAndUpdate(
          id, 
          { 
            is_active: Boolean(is_active),
            updated_by: userId
          }, 
          { new: true }
        )
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email');

      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          error: 'Commission rule not found'
        });
      }

      res.json({
        success: true,
        data: updatedRule,
        message: `Commission rule ${is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling commission rule status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Calculate total commission for given conditions
  async calculateCommission(req, res) {
    try {
      const { salesAmount, userTier, networkSize, growthRate } = req.body;

      if (!salesAmount) {
        return res.status(400).json({
          success: false,
          error: 'Sales amount is required'
        });
      }

      const activeRules = await commissionRuleModel.model.getActiveRules();
      let totalCommission = 0;
      const appliedRules = [];

      for (const rule of activeRules) {
        const conditions = {
          salesAmount: parseFloat(salesAmount),
          userTier,
          networkSize: networkSize || 0,
          growthRate: growthRate || 0
        };

        if (rule.appliesTo(conditions)) {
          const commission = rule.calculateCommission(conditions.salesAmount, userTier);
          totalCommission += commission;
          appliedRules.push({
            rule: rule.name,
            rate: rule.rate,
            type: rule.type,
            commission
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalCommission,
          appliedRules,
          conditions: {
            salesAmount: parseFloat(salesAmount),
            userTier,
            networkSize: networkSize || 0,
            growthRate: growthRate || 0
          }
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

module.exports = new CommissionRuleController();