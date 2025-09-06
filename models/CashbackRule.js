const BaseModel = require('./BaseModel');
const CashbackRuleSchema = require('../schemas/CashbackRule');

class CashbackRule extends BaseModel {
  constructor() {
    super(CashbackRuleSchema);
  }

  async findByCode(code) {
    return await CashbackRuleSchema.findOne({ code: code.toUpperCase() });
  }

  async findActive() {
    return await CashbackRuleSchema.find({ status: 'active' });
  }

  async findByType(type) {
    return await CashbackRuleSchema.find({ type, status: 'active' });
  }
}

module.exports = CashbackRule; 