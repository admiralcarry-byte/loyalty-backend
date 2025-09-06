const BaseModel = require('./BaseModel');
const CommissionSchema = require('../schemas/Commission');

class Commission extends BaseModel {
  constructor() {
    super(CommissionSchema);
  }

  async findByCommissionNumber(commissionNumber) {
    return await CommissionSchema.findByCommissionNumber(commissionNumber);
  }

  async findByUser(userId) {
    return await CommissionSchema.findByUser(userId);
  }

  async findByStore(storeId) {
    return await CommissionSchema.findByStore(storeId);
  }

  async findPending() {
    return await CommissionSchema.findPending();
  }

  async findOverdue() {
    return await CommissionSchema.findOverdue();
  }

  async findByType(type) {
    return await CommissionSchema.findByType(type);
  }

  async findByStatus(status) {
    return await CommissionSchema.findByStatus(status);
  }

  async getCommissionStats() {
    return await CommissionSchema.getCommissionStats();
  }
}

module.exports = Commission; 