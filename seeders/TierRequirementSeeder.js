const BaseSeeder = require('./BaseSeeder');

/**
 * Tier Requirement seeder - Creates tier requirements for user progression
 */
class TierRequirementSeeder extends BaseSeeder {
  async seed() {
    console.log('🏆 Seeding tier requirements...');
    
    const existingCount = await this.getExistingCount('tierrequirements');
    if (existingCount > 0) {
      console.log(`ℹ️  Tier requirements collection already has ${existingCount} records. Clearing first...`);
      await this.clearCollection('tierrequirements');
    }

    const tierRequirements = [
      {
        tier: 'lead',
        minimum_liters: 0,
        display_name: 'Lead',
        description: 'New customer level with basic benefits',
        color: '#6B7280',
        icon: 'star',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        tier: 'silver',
        minimum_liters: 50,
        display_name: 'Silver',
        description: 'Regular customer with enhanced benefits',
        color: '#9CA3AF',
        icon: 'medal',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        tier: 'gold',
        minimum_liters: 80,
        display_name: 'Gold',
        description: 'Loyal customer with premium benefits',
        color: '#F59E0B',
        icon: 'crown',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        tier: 'platinum',
        minimum_liters: 100,
        display_name: 'Platinum',
        description: 'VIP customer with exclusive benefits',
        color: '#8B5CF6',
        icon: 'diamond',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    try {
      const TierRequirement = require('../models/TierRequirement');
      const tierRequirementModel = new TierRequirement();
      
      for (const requirement of tierRequirements) {
        await tierRequirementModel.model.create(requirement);
      }
      
      console.log(`✅ Successfully seeded ${tierRequirements.length} tier requirements`);
      return tierRequirements;
    } catch (error) {
      console.error('❌ Error seeding tier requirements:', error);
      throw error;
    }
  }
}

module.exports = TierRequirementSeeder;