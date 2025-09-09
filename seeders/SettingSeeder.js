const BaseSeeder = require('./BaseSeeder');

/**
 * Setting seeder - Creates sample settings
 */
class SettingSeeder extends BaseSeeder {
  async seed() {
    console.log('⚙️ Seeding settings...');
    
    const existingCount = await this.getExistingCount('settings');
    if (existingCount > 0) {
      console.log(`ℹ️  Settings collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const settings = [
      {
        key: 'app_name',
        value: 'ÁGUA TWEZAH Admin',
        type: 'string',
        category: 'general',
        description: 'Application name',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min_length: 3,
          max_length: 100
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'app_version',
        value: '1.0.0',
        type: 'string',
        category: 'general',
        description: 'Application version',
        is_public: true,
        is_editable: false,
        validation_rules: {
          required: true,
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'default_currency',
        value: 'USD',
        type: 'string',
        category: 'financial',
        description: 'Default currency for transactions',
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
        key: 'points_per_dollar',
        value: '10',
        type: 'number',
        category: 'loyalty',
        description: 'Points earned per dollar spent',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min: 1,
          max: 100
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'max_points_redemption',
        value: '1000',
        type: 'number',
        category: 'loyalty',
        description: 'Maximum points that can be redeemed per transaction',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true,
          min: 100,
          max: 10000
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'default_commission_rate',
        value: '5.0',
        type: 'number',
        category: 'commission',
        description: 'Default commission rate percentage',
        is_public: false,
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
        key: 'maintenance_mode',
        value: 'false',
        type: 'boolean',
        category: 'system',
        description: 'Enable maintenance mode',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'max_file_upload_size',
        value: '10485760',
        type: 'number',
        category: 'system',
        description: 'Maximum file upload size in bytes (10MB)',
        is_public: false,
        is_editable: true,
        validation_rules: {
          required: true,
          min: 1048576,
          max: 104857600
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'email_notifications_enabled',
        value: 'true',
        type: 'boolean',
        category: 'notifications',
        description: 'Enable email notifications',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'sms_notifications_enabled',
        value: 'true',
        type: 'boolean',
        category: 'notifications',
        description: 'Enable SMS notifications',
        is_public: true,
        is_editable: true,
        validation_rules: {
          required: true
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('settings', settings, { clearFirst: false });
  }
}

module.exports = SettingSeeder;