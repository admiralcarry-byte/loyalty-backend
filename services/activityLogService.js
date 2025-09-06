const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

class ActivityLogService {
  async createActivityLog(activityData) {
    try {
      const activity = new ActivityLog(activityData);
      await activity.save();
      return { success: true, data: activity };
    } catch (error) {
      console.error('Error creating activity log:', error);
      return { success: false, error: error.message };
    }
  }

  async getActivityLogs(params = {}) {
    try {
      const activityLogModel = new ActivityLog();
      const result = await activityLogModel.getActivityLogsWithPagination(params);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return { success: false, error: error.message };
    }
  }

  async getActivityLogById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid activity log ID' };
      }

      const activityLogModel = new ActivityLog();
      const activity = await activityLogModel.findById(id);

      if (!activity) {
        return { success: false, error: 'Activity log not found' };
      }

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error fetching activity log:', error);
      return { success: false, error: error.message };
    }
  }

  async updateActivityLog(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid activity log ID' };
      }

      const activityLogModel = new ActivityLog();
      const activity = await activityLogModel.update(id, updateData);
      
      if (!activity) {
        return { success: false, error: 'Activity log not found' };
      }

      return { success: true, data: activity };
    } catch (error) {
      console.error('Error updating activity log:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteActivityLog(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid activity log ID' };
      }

      const activityLogModel = new ActivityLog();
      const activity = await activityLogModel.delete(id);
      
      if (!activity) {
        return { success: false, error: 'Activity log not found' };
      }

      return { success: true, message: 'Activity log deleted successfully' };
    } catch (error) {
      console.error('Error deleting activity log:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserActivityLogs(userId, params = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return { success: false, error: 'Invalid user ID' };
      }

      const userParams = { ...params, user_id: userId };
      const result = await ActivityLog.getPaginatedLogs(userParams);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ActivityLogService();