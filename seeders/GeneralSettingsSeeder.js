const BaseSeeder = require('./BaseSeeder');

/**
 * General Settings seeder - Creates sample general settings
 */
class GeneralSettingsSeeder extends BaseSeeder {
  async seed() {
    console.log('⚙️ Seeding general settings...');
    
    const existingCount = await this.getExistingCount('general_settings');
    if (existingCount > 0) {
      console.log(`ℹ️  General settings collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const generalSettings = [
      {
        key: 'company_name',
        value: 'ÁGUA TWEZAH',
        type: 'string',
        category: 'company',
        description: 'Company name',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min_length: 2,
          max_length: 100
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'company_logo',
        value: '/images/logo.png',
        type: 'string',
        category: 'company',
        description: 'Company logo URL',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: false,
          format: 'url'
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'company_address',
        value: 'Rua da Independência, 123, Luanda, Angola',
        type: 'string',
        category: 'company',
        description: 'Company address',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min_length: 10,
          max_length: 200
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'company_phone',
        value: '+244123456789',
        type: 'string',
        category: 'company',
        description: 'Company phone number',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          pattern: '^\\+[1-9]\\d{1,14}$'
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'company_email',
        value: 'info@aguatwezah.com',
        type: 'string',
        category: 'company',
        description: 'Company email address',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          format: 'email'
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'default_language',
        value: 'pt',
        type: 'string',
        category: 'localization',
        description: 'Default language code',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          enum: ['pt', 'en', 'es', 'fr']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'default_timezone',
        value: 'Africa/Luanda',
        type: 'string',
        category: 'localization',
        description: 'Default timezone',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          enum: ['Africa/Luanda', 'UTC', 'Europe/Lisbon']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'default_currency',
        value: 'USD',
        type: 'string',
        category: 'financial',
        description: 'Default currency',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          enum: ['USD', 'AOA', 'EUR']
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'tax_rate',
        value: '15.0',
        type: 'number',
        category: 'financial',
        description: 'Default tax rate percentage',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min: 0,
          max: 50
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'points_expiry_days',
        value: '365',
        type: 'number',
        category: 'loyalty',
        description: 'Points expiry period in days',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min: 30,
          max: 1095
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('general_settings', generalSettings, { clearFirst: true });
  }
}

module.exports = GeneralSettingsSeeder;