const BaseModel = require('./BaseModel');
const TierRequirementSchema = require('../schemas/TierRequirement');

class TierRequirement extends BaseModel {
  constructor() {
    super(TierRequirementSchema);
  }

  // Get tier for given liter amount
  async getTierForLiters(totalLiters) {
    return await this.model.getTierForLiters(totalLiters);
  }

  // Get all active requirements
  async getActiveRequirements() {
    try {
      const results = await this.model.find({ is_active: true }).sort({ minimum_liters: 1 });
      console.log('getActiveRequirements results:', results);
      return results;
    } catch (error) {
      console.error('Error in getActiveRequirements:', error);
      throw error;
    }
  }

  // Update tier requirements
  async updateRequirements(requirements) {
    // Delete all existing requirements to avoid duplicate key errors
    await this.model.deleteMany({});
    
    // Create new requirements
    const newRequirements = requirements.map(req => ({
      ...req,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    return await this.model.insertMany(newRequirements);
  }
}

module.exports = TierRequirement;