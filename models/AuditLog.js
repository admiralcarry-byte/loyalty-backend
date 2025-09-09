const BaseModel = require('./BaseModel');
const AuditLogSchema = require('../schemas/AuditLog');

class AuditLog extends BaseModel {
  constructor() {
    super(AuditLogSchema);
  }

  // Static create method for backward compatibility
  static async create(data) {
    const instance = new AuditLog();
    return await instance.create(data);
  }

  async findByEntity(entityType, entityId) {
    return await AuditLogSchema.findByEntity(entityType, entityId);
  }

  async findByUser(userId) {
    return await AuditLogSchema.findByUser(userId);
  }

  async findByAction(action) {
    return await AuditLogSchema.findByAction(action);
  }

  async findByRiskLevel(riskLevel) {
    return await AuditLogSchema.findByRiskLevel(riskLevel);
  }

  async findHighRiskActions() {
    return await AuditLogSchema.findHighRiskActions();
  }

  async findByModule(module) {
    return await AuditLogSchema.findByModule(module);
  }

  async findByDateRange(startDate, endDate) {
    return await AuditLogSchema.findByDateRange(startDate, endDate);
  }

  async findByRequestId(requestId) {
    return await AuditLogSchema.findByRequestId(requestId);
  }

  async getAuditLogStats() {
    return await AuditLogSchema.getAuditLogStats();
  }

  // Static createLog method for backward compatibility with existing code
  static async createLog(data) {
    const instance = new AuditLog();
    return await instance.create(data);
  }
}

module.exports = AuditLog; 