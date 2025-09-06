const BaseModel = require('./BaseModel');
const AuditLogSchema = require('../schemas/AuditLog');

class AuditLog extends BaseModel {
  constructor() {
    super(AuditLogSchema);
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
}

module.exports = AuditLog; 