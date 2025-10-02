const TierRequirement = require('../models/TierRequirement');

class TierRequirementController {
  // Get all tier requirements
  async getAllRequirements(req, res) {
    try {
      const tierRequirementModel = new TierRequirement();
      const requirements = await tierRequirementModel.getActiveRequirements();
      
      console.log('Tier requirements from controller:', requirements);
      console.log('Number of requirements:', requirements ? requirements.length : 0);
      
      res.json({
        success: true,
        data: requirements
      });
    } catch (error) {
      console.error('Error getting tier requirements:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update tier requirements
  async updateRequirements(req, res) {
    try {
      const { requirements } = req.body;
      
      if (!Array.isArray(requirements)) {
        return res.status(400).json({
          success: false,
          error: 'Requirements must be an array'
        });
      }

      // Validate requirements
      for (const req of requirements) {
        if (!req.tier || req.minimum_liters === undefined || req.minimum_liters === null || !req.display_name) {
          console.log('Validation failed for requirement:', req);
          return res.status(400).json({
            success: false,
            error: 'Each requirement must have tier, minimum_liters, and display_name'
          });
        }
      }

      const tierRequirementModel = new TierRequirement();
      const updatedRequirements = await tierRequirementModel.updateRequirements(requirements);
      
      // Update all users' tiers based on new requirements
      try {
        const User = require('../models/User');
        const userModel = new User();
        const updateResult = await userModel.updateAllUserTiers();
        
        console.log(`Updated ${updateResult.updatedCount} out of ${updateResult.totalUsers} users' tiers`);
      } catch (userUpdateError) {
        console.error('Error updating user tiers after requirement change:', userUpdateError);
        // Don't fail the request, just log the error
      }
      
      res.json({
        success: true,
        message: 'Tier requirements updated successfully',
        data: updatedRequirements
      });
    } catch (error) {
      console.error('Error updating tier requirements:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get tier for given liter amount
  async getTierForLiters(req, res) {
    try {
      const { liters } = req.params;
      
      if (!liters || isNaN(liters)) {
        return res.status(400).json({
          success: false,
          error: 'Valid liters amount is required'
        });
      }

      const tierRequirementModel = new TierRequirement();
      const tier = await tierRequirementModel.getTierForLiters(parseFloat(liters));
      
      res.json({
        success: true,
        data: {
          liters: parseFloat(liters),
          tier
        }
      });
    } catch (error) {
      console.error('Error getting tier for liters:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new TierRequirementController();