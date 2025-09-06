const { PayoutRequest, Commission, User, AuditLog } = require('../models');

class PayoutRequestController {
  // Get all payout requests with pagination and filters
  async getAllPayoutRequests(req) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      user_id = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['created_at', 'amount', 'status', 'approval.requested_date'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) {
      throw new Error('Invalid sort field');
    }

    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      throw new Error('Invalid sort order');
    }

    // Build match conditions for aggregation
    const matchConditions = {};

    if (status) {
      matchConditions.status = status;
    }

    if (user_id) {
      matchConditions.user = user_id;
    }

    if (start_date || end_date) {
      matchConditions.createdAt = {};
      if (start_date) {
        matchConditions.createdAt.$gte = new Date(start_date);
      }
      if (end_date) {
        matchConditions.createdAt.$lte = new Date(end_date);
      }
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'approval.approved_by',
          foreignField: '_id',
          as: 'approvedByDetails'
        }
      },
      {
        $unwind: {
          path: '$approvedByDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'approval.rejected_by',
          foreignField: '_id',
          as: 'rejectedByDetails'
        }
      },
      {
        $unwind: {
          path: '$rejectedByDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { request_number: { $regex: search, $options: 'i' } },
            { 'userDetails.first_name': { $regex: search, $options: 'i' } },
            { 'userDetails.last_name': { $regex: search, $options: 'i' } },
            { 'userDetails.email': { $regex: search, $options: 'i' } },
            { 'bank_details.account_name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting
    const sortField = sortBy === 'created_at' ? 'createdAt' : sortBy;
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: sortDirection } });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const payoutRequestInstance = new PayoutRequest();
    const countResult = await payoutRequestInstance.model.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push(
      { $skip: offset },
      { $limit: parseInt(limit) }
    );

    const payoutRequests = await payoutRequestInstance.model.aggregate(pipeline);

    return {
      payoutRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get payout request by ID
  async getPayoutRequestById(id) {
    const payoutRequestInstance = new PayoutRequest();
    const payoutRequest = await payoutRequestInstance.model
      .findById(id)
      .populate('user', 'first_name last_name email phone')
      .populate('approval.approved_by', 'first_name last_name')
      .populate('approval.rejected_by', 'first_name last_name')
      .populate('payment.processed_by', 'first_name last_name')
      .populate('related_commissions');

    if (!payoutRequest) {
      throw new Error('Payout request not found');
    }

    return payoutRequest;
  }

  // Create new payout request
  async createPayoutRequest(payoutRequestData) {
    const payoutRequestInstance = new PayoutRequest();
    return await payoutRequestInstance.createPayoutRequest(payoutRequestData);
  }

  // Approve payout request
  async approvePayoutRequest(id, approvedBy, notes = '') {
    const payoutRequestInstance = new PayoutRequest();
    const payoutRequest = await payoutRequestInstance.approvePayoutRequest(id, approvedBy, notes);

    // Update related commissions to approved status
    if (payoutRequest.related_commissions && payoutRequest.related_commissions.length > 0) {
      const commissionInstance = new Commission();
      for (const commissionId of payoutRequest.related_commissions) {
        await commissionInstance.updateById(commissionId, { 
          status: 'approved',
          'approval.approved_by': approvedBy,
          'approval.approved_date': new Date()
        });
      }
    }

    // Create audit log
    await this.createAuditLog({
      action: 'PAYOUT_REQUEST_APPROVED',
      entity_type: 'PayoutRequest',
      entity_id: id,
      user_id: approvedBy,
      details: {
        payout_amount: payoutRequest.amount,
        currency: payoutRequest.currency,
        notes: notes
      }
    });

    return payoutRequest;
  }

  // Reject payout request
  async rejectPayoutRequest(id, rejectedBy, reason = '') {
    const payoutRequestInstance = new PayoutRequest();
    const payoutRequest = await payoutRequestInstance.rejectPayoutRequest(id, rejectedBy, reason);

    // Create audit log
    await this.createAuditLog({
      action: 'PAYOUT_REQUEST_REJECTED',
      entity_type: 'PayoutRequest',
      entity_id: id,
      user_id: rejectedBy,
      details: {
        payout_amount: payoutRequest.amount,
        currency: payoutRequest.currency,
        rejection_reason: reason
      }
    });

    return payoutRequest;
  }

  // Mark payout request as paid
  async markAsPaid(id, paymentDetails, processedBy) {
    const payoutRequestInstance = new PayoutRequest();
    const payoutRequest = await payoutRequestInstance.markAsPaid(id, paymentDetails, processedBy);

    // Update related commissions to paid status
    if (payoutRequest.related_commissions && payoutRequest.related_commissions.length > 0) {
      const commissionInstance = new Commission();
      for (const commissionId of payoutRequest.related_commissions) {
        await commissionInstance.updateById(commissionId, { 
          status: 'paid',
          'payment_details.payment_date': new Date(),
          'payment_details.payment_reference': paymentDetails.payment_reference,
          'payment_details.transaction_id': paymentDetails.transaction_id
        });
      }
    }

    // Create audit log
    await this.createAuditLog({
      action: 'PAYOUT_REQUEST_PAID',
      entity_type: 'PayoutRequest',
      entity_id: id,
      user_id: processedBy,
      details: {
        payout_amount: payoutRequest.amount,
        currency: payoutRequest.currency,
        payment_method: paymentDetails.payment_method,
        payment_reference: paymentDetails.payment_reference
      }
    });

    return payoutRequest;
  }

  // Get payout request statistics
  async getPayoutStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const payoutRequestInstance = new PayoutRequest();
      const stats = await payoutRequestInstance.getPayoutStats();

      // Get additional time-based stats
      const todayStats = await payoutRequestInstance.getPayoutStats(today, new Date());
      const weekStats = await payoutRequestInstance.getPayoutStats(weekAgo, new Date());
      const monthStats = await payoutRequestInstance.getPayoutStats(monthAgo, new Date());

      return {
        ...stats,
        requests_today: todayStats.total_requests,
        requests_week: weekStats.total_requests,
        requests_month: monthStats.total_requests,
        amount_today: todayStats.total_amount,
        amount_week: weekStats.total_amount,
        amount_month: monthStats.total_amount
      };
    } catch (error) {
      console.error('Error getting payout stats:', error);
      return {
        total_requests: 0,
        total_amount: 0,
        pending_requests: 0,
        approved_requests: 0,
        paid_requests: 0,
        rejected_requests: 0,
        pending_amount: 0,
        approved_amount: 0,
        paid_amount: 0,
        rejected_amount: 0,
        average_amount: 0,
        requests_today: 0,
        requests_week: 0,
        requests_month: 0,
        amount_today: 0,
        amount_week: 0,
        amount_month: 0
      };
    }
  }

  // Get pending payout requests
  async getPendingPayoutRequests() {
    const payoutRequestInstance = new PayoutRequest();
    return await payoutRequestInstance.findPending();
  }

  // Get payout requests by user
  async getPayoutRequestsByUser(userId, limit = 10) {
    const payoutRequestInstance = new PayoutRequest();
    return await payoutRequestInstance.findByUser(userId).limit(limit);
  }

  // Helper method to create audit log
  async createAuditLog(logData) {
    try {
      const auditLogInstance = new AuditLog();
      await auditLogInstance.create({
        ...logData,
        timestamp: new Date(),
        context: {
          module: 'PayoutRequest',
          feature: 'Payout Management'
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error as audit logging is not critical
    }
  }
}

module.exports = new PayoutRequestController();