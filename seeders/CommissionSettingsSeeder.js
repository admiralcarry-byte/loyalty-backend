const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Commission Settings seeder - Creates sample commission settings
 */
class CommissionSettingsSeeder extends BaseSeeder {
  async seed() {
    console.log('⚙️ Seeding commission settings...');
    
    const existingCount = await this.getExistingCount('commissionsettings');
    if (existingCount > 0) {
      console.log(`ℹ️  Commission settings collection already has ${existingCount} records. Skipping.`);
      return;
    }

    const commissionSettings = [
      {
        setting_name: "base_commission_rate",
        setting_value: 0.05,
        setting_type: "percentage",
        description: "Base commission rate for all sales",
        category: "general",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "minimum_commission_amount",
        setting_value: 1.00,
        setting_type: "currency",
        description: "Minimum commission amount to be paid",
        category: "general",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "maximum_commission_rate",
        setting_value: 0.15,
        setting_type: "percentage",
        description: "Maximum commission rate allowed",
        category: "limits",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_calculation_method",
        setting_value: "percentage_of_sale",
        setting_type: "string",
        description: "Method used to calculate commissions",
        category: "calculation",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_payment_frequency",
        setting_value: "monthly",
        setting_type: "string",
        description: "How often commissions are paid",
        category: "payment",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_approval_required",
        setting_value: true,
        setting_type: "boolean",
        description: "Whether commission payments require approval",
        category: "approval",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_hold_period_days",
        setting_value: 7,
        setting_type: "number",
        description: "Number of days to hold commission before payment",
        category: "payment",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_tax_rate",
        setting_value: 0.10,
        setting_type: "percentage",
        description: "Tax rate applied to commission payments",
        category: "tax",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_bonus_threshold",
        setting_value: 1000,
        setting_type: "currency",
        description: "Sales threshold to qualify for bonus commission",
        category: "bonus",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_name: "commission_auto_approval_limit",
        setting_value: 100,
        setting_type: "currency",
        description: "Commission amount below which auto-approval is enabled",
        category: "approval",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await this.seedCollection('commissionsettings', commissionSettings, { clearFirst: false });
  }
}

module.exports = CommissionSettingsSeeder;