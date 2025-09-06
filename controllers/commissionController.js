const { Commission, User, Sale, Store } = require('../models');

class CommissionController {
  // Get all commissions with pagination and filters
  async getAllCommissions(req) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      user_id = '',
      store_id = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'amount', 'status', 'created_at', 'user_id', 'store_id'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) {
      throw new Error('Invalid sort field');
    }

    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      throw new Error('Invalid sort order');
    }

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(c.id LIKE ? OR c.reference_number LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('c.status = ?');
      params.push(status);
    }

    if (user_id) {
      whereConditions.push('c.user_id = ?');
      params.push(user_id);
    }

    if (store_id) {
      whereConditions.push('c.store_id = ?');
      params.push(store_id);
    }

    if (start_date) {
      whereConditions.push('DATE(c.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(c.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commissions c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN stores st ON c.store_id = st.id 
      ${whereClause}
    `;
    const commissionInstance = new Commission();
    const countResult = await commissionInstance.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get commissions with user and store details
    const commissionsQuery = `
      SELECT 
        c.*,
        u.first_name, u.last_name, u.email,
        st.name as store_name, st.city as store_city
      FROM commissions c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN stores st ON c.store_id = st.id 
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const commissions = await commissionInstance.executeQuery(commissionsQuery, [...params, parseInt(limit), offset]);

    return {
      commissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get commission by ID
  async getCommissionById(id) {
    const commissionInstance = new Commission();
    const commission = await commissionInstance.executeQuery(`
      SELECT 
        c.*,
        u.first_name, u.last_name, u.email, u.phone,
        st.name as store_name, st.address as store_address, st.city as store_city
      FROM commissions c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN stores st ON c.store_id = st.id 
      WHERE c.id = ?
    `, [id]);

    if (!commission || commission.length === 0) {
      throw new Error('Commission not found');
    }

    return commission[0];
  }

  // Create new commission
  async createCommission(commissionData) {
    // Validate required fields
    if (!commissionData.user_id || !commissionData.store_id || !commissionData.amount) {
      throw new Error('User ID, store ID, and amount are required');
    }

    // Check if user exists
    const user = await User.findById(commissionData.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if store exists
    const store = await Store.findById(commissionData.store_id);
    if (!store) {
      throw new Error('Store not found');
    }

    // Validate amount
    if (commissionData.amount <= 0) {
      throw new Error('Commission amount must be positive');
    }

    // Generate reference number if not provided
    if (!commissionData.reference_number) {
      commissionData.reference_number = this.generateReferenceNumber();
    }

    // Set default status
    if (!commissionData.status) {
      commissionData.status = 'pending';
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
    if (!validStatuses.includes(commissionData.status)) {
      throw new Error('Invalid status');
    }

    return await Commission.create(commissionData);
  }

  // Update commission
  async updateCommission(id, commissionData) {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new Error('Commission not found');
    }

    // Don't allow updating paid commissions
    if (commission.status === 'paid' && commissionData.status !== 'paid') {
      throw new Error('Cannot modify paid commissions');
    }

    // Validate amount if being updated
    if (commissionData.amount && commissionData.amount <= 0) {
      throw new Error('Commission amount must be positive');
    }

    return await Commission.updateById(id, commissionData);
  }

  // Delete commission
  async deleteCommission(id) {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new Error('Commission not found');
    }

    // Don't allow deleting paid commissions
    if (commission.status === 'paid') {
      throw new Error('Cannot delete paid commissions');
    }

    return await Commission.deleteById(id);
  }

  // Update commission status
  async updateCommissionStatus(id, status) {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new Error('Commission not found');
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Validate status transitions
    if (commission.status === 'paid' && status !== 'paid') {
      throw new Error('Cannot change status of paid commission');
    }

    if (commission.status === 'rejected' && status === 'paid') {
      throw new Error('Rejected commission cannot be paid');
    }

    return await Commission.updateById(id, { status });
  }

  // Get commission statistics
  async getCommissionStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const pipeline = [
        {
          $group: {
            _id: null,
            total_commissions: { $sum: 1 },
            total_commission_amount: { $sum: '$amount' },
            avg_commission_amount: { $avg: '$amount' },
            pending_commissions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approved_commissions: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejected_commissions: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            paid_commissions: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            total_paid_commissions: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            total_pending_commissions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            total_approved_commissions: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
            commissions_today: { $sum: { $cond: [{ $gte: ['$created_at', today] }, 1, 0] } },
            commissions_week: { $sum: { $cond: [{ $gte: ['$created_at', weekAgo] }, 1, 0] } },
            commissions_month: { $sum: { $cond: [{ $gte: ['$created_at', monthAgo] }, 1, 0] } }
          }
        }
      ];

      const commissionInstance = new Commission();
      const result = await commissionInstance.model.aggregate(pipeline);
      return result[0] || {
        total_commissions: 0,
        total_commission_amount: 0,
        avg_commission_amount: 0,
        pending_commissions: 0,
        approved_commissions: 0,
        rejected_commissions: 0,
        paid_commissions: 0,
        total_paid_commissions: 0,
        total_pending_commissions: 0,
        total_approved_commissions: 0,
        commissions_today: 0,
        commissions_week: 0,
        commissions_month: 0
      };
    } catch (error) {
      console.error('Error getting commission stats:', error);
      return {
        total_commissions: 0,
        total_commission_amount: 0,
        avg_commission_amount: 0,
        pending_commissions: 0,
        approved_commissions: 0,
        rejected_commissions: 0,
        paid_commissions: 0,
        total_paid_commissions: 0,
        total_pending_commissions: 0,
        total_approved_commissions: 0,
        commissions_today: 0,
        commissions_week: 0,
        commissions_month: 0
      };
    }
  }

  // Get commissions by user
  async getCommissionsByUser(userId, limit = 10) {
    const commissionInstance = new Commission();
    return await commissionInstance.executeQuery(`
      SELECT c.*, st.name as store_name, st.city as store_city
      FROM commissions c 
      LEFT JOIN stores st ON c.store_id = st.id 
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT ?
    `, [userId, limit]);
  }

  // Get commissions by store
  async getCommissionsByStore(storeId, limit = 10) {
    const commissionInstance = new Commission();
    return await commissionInstance.executeQuery(`
      SELECT c.*, u.first_name, u.last_name, u.email
      FROM commissions c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.store_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT ?
    `, [storeId, limit]);
  }

  // Generate reference number
  generateReferenceNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `COMM-${timestamp}-${random}`;
  }

  // Calculate commission for a sale
  async calculateCommission(saleId, commissionRate) {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    if (commissionRate <= 0 || commissionRate > 1) {
      throw new Error('Commission rate must be between 0 and 1');
    }

    const commissionAmount = sale.total_amount * commissionRate;

    return {
      sale_id: saleId,
      user_id: sale.user_id,
      store_id: sale.store_id,
      amount: commissionAmount,
      rate: commissionRate,
      sale_amount: sale.total_amount
    };
  }

  // Bulk approve commissions
  async bulkApproveCommissions(commissionIds) {
    if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
      throw new Error('Commission IDs array is required');
    }

    const commissionInstance = new Commission();
    const placeholders = commissionIds.map(() => '?').join(',');
    
    const result = await commissionInstance.executeQuery(`
      UPDATE commissions 
      SET status = 'approved', updated_at = NOW() 
      WHERE id IN (${placeholders}) AND status = 'pending'
    `, commissionIds);

    return {
      message: `${result.affectedRows} commissions approved`,
      affected_rows: result.affectedRows
    };
  }

  // Get pending commissions total
  async getPendingCommissionsTotal() {
    const commissionInstance = new Commission();
    const result = await commissionInstance.executeQuery(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM commissions 
      WHERE status = 'pending'
    `);

    return result[0];
  }
}

module.exports = new CommissionController(); 