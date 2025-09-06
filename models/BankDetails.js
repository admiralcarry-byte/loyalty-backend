const BaseModel = require('./BaseModel');
const BankDetailsSchema = require('../schemas/BankDetails');

class BankDetails extends BaseModel {
  constructor() {
    super(BankDetailsSchema);
  }

  // Create new bank details
  async createBankDetails(bankData) {
    try {
      // If this is set as primary, unset other primary accounts for this user
      if (bankData.is_primary) {
        await this.updateMany(
          { user_id: bankData.user_id, is_active: true },
          { is_primary: false }
        );
      }

      return await this.create(bankData);
    } catch (error) {
      throw new Error(`Failed to create bank details: ${error.message}`);
    }
  }

  // Update bank details
  async updateBankDetails(bankDetailsId, updateData) {
    try {
      // If setting as primary, unset other primary accounts for this user
      if (updateData.is_primary) {
        const bankDetails = await this.findById(bankDetailsId);
        if (bankDetails) {
          await this.updateMany(
            { user_id: bankDetails.user_id, is_active: true, _id: { $ne: bankDetailsId } },
            { is_primary: false }
          );
        }
      }

      return await this.updateById(bankDetailsId, updateData);
    } catch (error) {
      throw new Error(`Failed to update bank details: ${error.message}`);
    }
  }

  // Verify bank details
  async verifyBankDetails(bankDetailsId, verifiedBy, status = 'verified', rejectionReason = null) {
    try {
      const updateData = {
        verification_status: status,
        verification_date: new Date(),
        verified_by: verifiedBy
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      return await this.updateById(bankDetailsId, updateData);
    } catch (error) {
      throw new Error(`Failed to verify bank details: ${error.message}`);
    }
  }

  // Get bank details by user ID
  async getByUserId(userId) {
    try {
      return await this.find({ user_id: userId, is_active: true })
        .populate('user_id', 'first_name last_name email phone')
        .sort({ is_primary: -1, created_at: -1 });
    } catch (error) {
      throw new Error(`Failed to get bank details for user: ${error.message}`);
    }
  }

  // Get bank details by verification status
  async getByVerificationStatus(status) {
    try {
      return await this.find({ verification_status: status, is_active: true })
        .populate('user_id', 'first_name last_name email phone')
        .sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Failed to get bank details by status: ${error.message}`);
    }
  }

  // Get verification statistics
  async getVerificationStats() {
    try {
      const stats = await this.aggregate([
        { $match: { is_active: true } },
        {
          $group: {
            _id: '$verification_status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Format the results
      const formattedStats = {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0
      };

      stats.forEach(stat => {
        formattedStats.total += stat.count;
        formattedStats[stat._id] = stat.count;
      });

      return formattedStats;
    } catch (error) {
      throw new Error(`Failed to get verification stats: ${error.message}`);
    }
  }

  // Get all bank details with pagination and filters
  async getAllBankDetails(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        bankFilter = 'all',
        statusFilter = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const query = { is_active: true };

      // Add search filter
      if (search) {
        query.$or = [
          { bank_name: { $regex: search, $options: 'i' } },
          { account_holder_name: { $regex: search, $options: 'i' } }
        ];
      }

      // Add bank filter
      if (bankFilter !== 'all') {
        query.bank_name = { $regex: bankFilter, $options: 'i' };
      }

      // Add status filter
      if (statusFilter !== 'all') {
        query.verification_status = statusFilter;
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [bankDetails, total] = await Promise.all([
        this.find(query)
          .populate('user_id', 'first_name last_name email phone')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        this.countDocuments(query)
      ]);

      return {
        bankDetails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get bank details: ${error.message}`);
    }
  }

  // Deactivate bank details (soft delete)
  async deactivateBankDetails(bankDetailsId) {
    try {
      return await this.updateById(bankDetailsId, { 
        is_active: false,
        updated_at: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to deactivate bank details: ${error.message}`);
    }
  }
}

module.exports = BankDetails;