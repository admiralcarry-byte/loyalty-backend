const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * General Settings seeder - Creates initial platform settings
 */
class GeneralSettingsSeeder extends BaseSeeder {
  async seed() {
    console.log('⚙️  Seeding general settings...');
    
    const existingCount = await this.getExistingCount('general_settings');
    if (existingCount > 0) {
      console.log(`ℹ️  General settings already exist (${existingCount} records). Skipping...`);
      return;
    }

    const generalSettings = {
      app_name: 'ÁGUA TWEZAH',
      support_email: 'support@aguatwezah.com',
      currency: 'USD',
      app_description: 'Premium Water Loyalty Program',
      timezone: 'Africa/Luanda',
      language: 'Portuguese',
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.seedCollection('general_settings', [generalSettings], { clearFirst: false });
    
    console.log('✅ General settings seeded successfully');
    console.log('   - App name: ÁGUA TWEZAH');
    console.log('   - Support email: support@aguatwezah.com');
    console.log('   - Currency: USD');
    console.log('   - Timezone: Africa/Luanda');
    console.log('   - Language: Portuguese');
  }
}

module.exports = GeneralSettingsSeeder;