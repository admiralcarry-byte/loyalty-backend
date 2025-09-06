const BaseModel = require('./BaseModel');
const NotificationSchema = require('../schemas/Notification');

class Notification extends BaseModel {
  constructor() {
    super(NotificationSchema);
  }

  async findByType(type) {
    return await NotificationSchema.findByType(type);
  }

  async findByCategory(category) {
    return await NotificationSchema.findByCategory(category);
  }

  async findPending() {
    return await NotificationSchema.findPending();
  }

  async findScheduled() {
    return await NotificationSchema.findScheduled();
  }

  async findForUser(userId, options = {}) {
    return await NotificationSchema.findForUser(userId, options);
  }

  async getNotificationStats() {
    return await NotificationSchema.getNotificationStats();
  }
}

module.exports = Notification; 