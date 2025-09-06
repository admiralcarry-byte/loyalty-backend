const BaseModel = require('./BaseModel');
const PayoutRequestSchema = require('../schemas/PayoutRequest');

class PayoutRequest extends BaseModel {
  constructor() {
    super(PayoutRequestSchema);
  }

  async findPending() {
    return await PayoutRequestSchema.findPending();
  }

  async findByUser(userId) {
    return await PayoutRequestSchema.findByUser(userId);
  }

  async findByStatus(status) {
    return await PayoutRequestSchema.findByStatus(status);
  }

  async getPayoutStats(startDate, endDate) {
    return await PayoutRequestSchema.getPayoutStats(startDate, endDate);
  }

  async approvePayoutRequest(requestId, approvedBy, notes = '') {
    const payoutRequest = await PayoutRequestSchema.findById(requestId);
    if (!payoutRequest) {
      throw new Error('Payout request not found');
    }

    if (payoutRequest.status !== 'pending') {
      throw new Error('Only pending payout requests can be approved');
    }

    return await payoutRequest.approve(approvedBy, notes);
  }

  async rejectPayoutRequest(requestId, rejectedBy, reason = '') {
    const payoutRequest = await PayoutRequestSchema.findById(requestId);
    if (!payoutRequest) {
      throw new Error('Payout request not found');
    }

    if (payoutRequest.status !== 'pending') {
      throw new Error('Only pending payout requests can be rejected');
    }

    return await payoutRequest.reject(rejectedBy, reason);
  }

  async markAsPaid(requestId, paymentDetails, processedBy) {
    const payoutRequest = await PayoutRequestSchema.findById(requestId);
    if (!payoutRequest) {
      throw new Error('Payout request not found');
    }

    if (payoutRequest.status !== 'approved') {
      throw new Error('Only approved payout requests can be marked as paid');
    }

    return await payoutRequest.markAsPaid(paymentDetails, processedBy);
  }

  async createPayoutRequest(requestData) {
    // Validate required fields
    if (!requestData.user || !requestData.amount || !requestData.bank_details) {
      throw new Error('User, amount, and bank details are required');
    }

    // Validate amount
    if (requestData.amount <= 0) {
      throw new Error('Payout amount must be positive');
    }

    // Validate bank details
    const { account_name, account_number, bank_name } = requestData.bank_details;
    if (!account_name || !account_number || !bank_name) {
      throw new Error('Account name, account number, and bank name are required');
    }

    // Set default commission breakdown if not provided
    if (!requestData.commission_breakdown) {
      requestData.commission_breakdown = {
        total_commission_earned: requestData.amount,
        previously_paid: 0,
        pending_payout: requestData.amount
      };
    }

    return await PayoutRequestSchema.create(requestData);
  }
}

module.exports = PayoutRequest;