const BaseModel = require('./BaseModel');
const LoyaltyLevelSchema = require('../schemas/LoyaltyLevel');

class LoyaltyLevel extends BaseModel {
  constructor() {
    super(LoyaltyLevelSchema);
  }

  async findByTier(tier) {
    return await LoyaltyLevelSchema.findByTier(tier);
  }

  async findByCode(code) {
    return await LoyaltyLevelSchema.findByCode(code);
  }

  async findActive() {
    return await LoyaltyLevelSchema.findActive();
  }

  async findByMinimumRequirements(criteria) {
    return await LoyaltyLevelSchema.findByMinimumRequirements(criteria);
  }

  async getLoyaltyLevelStats() {
    return await LoyaltyLevelSchema.getLoyaltyLevelStats();
  }
}

module.exports = LoyaltyLevel; 