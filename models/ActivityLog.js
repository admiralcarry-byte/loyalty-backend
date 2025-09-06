const BaseModel = require('./BaseModel');
const ActivityLogSchema = require('../schemas/ActivityLog');

class ActivityLog extends BaseModel {
  constructor() {
    super(ActivityLogSchema);
  }

  // Get activity logs with pagination and filtering
  async getActivityLogsWithPagination(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        user_id,
        status,
        start_date,
        end_date
      } = params;

      const skip = (page - 1) * limit;
      const conditions = {};

      if (user_id) {
        conditions.user_id = user_id;
      }

      if (status) {
        conditions.status = status;
      }

      if (start_date || end_date) {
        conditions.created_at = {};
        if (start_date) {
          conditions.created_at.$gte = new Date(start_date);
        }
        if (end_date) {
          conditions.created_at.$lte = new Date(end_date);
        }
      }

      const [activities, totalCount] = await Promise.all([
        this.findAll(conditions, {
          sort: { created_at: -1 },
          limit: parseInt(limit),
          skip: parseInt(skip),
          populate: {
            path: 'user_id',
            select: 'first_name last_name email'
          }
        }),
        this.model.countDocuments(conditions)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in getActivityLogsWithPagination:', error);
      throw error;
    }
  }

  // Get user-specific activity logs
  async getUserActivityLogs(userId, params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        start_date,
        end_date
      } = params;

      const skip = (page - 1) * limit;
      const conditions = { user_id: userId };

      if (status) {
        conditions.status = status;
      }

      if (start_date || end_date) {
        conditions.created_at = {};
        if (start_date) {
          conditions.created_at.$gte = new Date(start_date);
        }
        if (end_date) {
          conditions.created_at.$lte = new Date(end_date);
        }
      }

      const [activities, totalCount] = await Promise.all([
        this.findAll(conditions, {
          sort: { created_at: -1 },
          limit: parseInt(limit),
          skip: parseInt(skip)
        }),
        this.model.countDocuments(conditions)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in getUserActivityLogs:', error);
      throw error;
    }
  }
}

module.exports = ActivityLog;