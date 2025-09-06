const BaseModel = require('./BaseModel');
const SettingSchema = require('../schemas/Setting');

class Setting extends BaseModel {
  constructor() {
    super(SettingSchema);
  }

  async findByKey(key) {
    return await SettingSchema.findOne({ key });
  }

  async findByCategory(category) {
    return await SettingSchema.find({ category });
  }

  async findPublic() {
    return await SettingSchema.find({ is_public: true });
  }
}

module.exports = Setting; 