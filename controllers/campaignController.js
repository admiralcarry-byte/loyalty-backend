const { Campaign, User, Store } = require('../models');

class CampaignController {
  // Get all campaigns with pagination and filters
  async getAllCampaigns(req) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        type = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const validSortFields = ['id', 'name', 'type', 'status', 'created_at', 'start_date', 'end_date'];
      const validSortOrders = ['ASC', 'DESC'];

      if (!validSortFields.includes(sortBy)) {
        throw new Error('Invalid sort field');
      }

      if (!validSortOrders.includes(sortOrder.toUpperCase())) {
        throw new Error('Invalid sort order');
      }

      // Build MongoDB query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      // Get campaigns with pagination and populate store references
      const campaignModel = new Campaign();
      const campaigns = await campaignModel.findAll(query, {
        sort: { [sortBy]: sortOrder.toLowerCase() === 'desc' ? -1 : 1 },
        skip: offset,
        limit: parseInt(limit),
        populate: 'rules.applicable_stores'
      });

      // Get total count
      const total = await campaignModel.count(query);
      const pages = Math.ceil(total / limit);

      // Transform campaigns to match frontend interface
      const transformedCampaigns = campaigns.map(campaign => ({
        id: campaign._id || campaign.id,
        name: campaign.name,
        description: campaign.description || campaign.short_description || '',
        type: campaign.type,
        status: campaign.status,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        targetAudience: campaign.targeting?.user_segments?.join(', ') || 'All Users',
        budget: campaign.budget?.total_budget || 0,
        spent: campaign.budget?.spent_amount || 0,
        participants: campaign.performance?.total_enrollments || 0,
        conversions: campaign.performance?.total_redemptions || 0,
        conversionRate: campaign.performance?.total_enrollments > 0 
          ? ((campaign.performance?.total_redemptions || 0) / campaign.performance.total_enrollments * 100).toFixed(1)
          : 0,
        roi: campaign.performance?.total_revenue_generated || 0,
        shops: campaign.rules?.applicable_stores?.map(store => store._id || store.id) || [],
        rewards: campaign.rules ? [
          {
            type: 'discount',
            value: campaign.rules.discount_percentage || 0,
            description: `${campaign.rules.discount_percentage || 0}% discount`
          }
        ] : [],
        conditions: {
          minPurchase: campaign.rules?.minimum_purchase || 0,
          minLiters: 0,
          loyaltyTier: campaign.rules?.applicable_user_tiers || []
        },
        createdAt: campaign.created_at || campaign.createdAt,
        updatedAt: campaign.updated_at || campaign.updatedAt
      }));

      return {
        campaigns: transformedCampaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      };
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return {
        campaigns: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  async getAllCampaignsOld(req) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      type = '',
      start_date = '',
      end_date = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'name', 'status', 'start_date', 'end_date', 'created_at'];
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
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    if (start_date) {
      whereConditions.push('start_date >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('end_date <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM campaigns ${whereClause}`;
    const campaignInstance = new Campaign();
    const countResult = await campaignInstance.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get campaigns
    const campaignsQuery = `
      SELECT * FROM campaigns 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const campaigns = await campaignInstance.executeQuery(campaignsQuery, [...params, parseInt(limit), offset]);

    return {
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get campaign by ID
  async getCampaignById(id) {
    const campaignModel = new Campaign();
    const campaign = await campaignModel.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get campaign statistics
    const stats = await this.getCampaignStats(id);
    campaign.stats = stats;

    return campaign;
  }

  // Create new campaign
  async createCampaign(campaignData) {
    // Validate required fields
    if (!campaignData.name || !campaignData.type || !campaignData.start_date) {
      throw new Error('Name, type, and start date are required');
    }

    // Validate dates
    if (campaignData.end_date && new Date(campaignData.start_date) >= new Date(campaignData.end_date)) {
      throw new Error('End date must be after start date');
    }

    // Set default status
    if (!campaignData.status) {
      campaignData.status = 'draft';
    }

    // Validate status
    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(campaignData.status)) {
      throw new Error('Invalid status');
    }

    return await Campaign.create(campaignData);
  }

  // Update campaign
  async updateCampaign(id, campaignData) {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Don't allow updating completed campaigns
    if (campaign.status === 'completed' && campaignData.status !== 'completed') {
      throw new Error('Cannot modify completed campaigns');
    }

    // Validate dates if being updated
    if (campaignData.start_date || campaignData.end_date) {
      const startDate = campaignData.start_date || campaign.start_date;
      const endDate = campaignData.end_date || campaign.end_date;
      
      if (endDate && new Date(startDate) >= new Date(endDate)) {
        throw new Error('End date must be after start date');
      }
    }

    return await Campaign.updateById(id, campaignData);
  }

  // Delete campaign
  async deleteCampaign(id) {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Don't allow deleting active campaigns
    if (campaign.status === 'active') {
      throw new Error('Cannot delete active campaigns');
    }

    return await Campaign.deleteById(id);
  }

  // Update campaign status
  async updateCampaignStatus(id, status) {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Check if campaign can be activated
    if (status === 'active') {
      if (new Date() < new Date(campaign.start_date)) {
        throw new Error('Campaign cannot be activated before start date');
      }
      if (campaign.end_date && new Date() > new Date(campaign.end_date)) {
        throw new Error('Campaign cannot be activated after end date');
      }
    }

    return await Campaign.updateById(id, { status });
  }

  // Get campaign statistics
  async getCampaignStats(campaignId = null) {
    if (campaignId) {
      // Get stats for specific campaign
      const campaignInstance = new Campaign();
      return await campaignInstance.getCampaignStats();
    } else {
      // Get overview stats for all campaigns from database
      const campaignInstance = new Campaign();
      return await campaignInstance.getCampaignOverviewStats();
    }
  }

  // Get active campaigns
  async getActiveCampaigns() {
    const campaignInstance = new Campaign();
    return await campaignInstance.executeQuery(`
      SELECT * FROM campaigns 
      WHERE status = 'active' 
      AND start_date <= CURDATE() 
      AND (end_date IS NULL OR end_date >= CURDATE())
      ORDER BY start_date ASC
    `);
  }

  // Get campaigns by type
  async getCampaignsByType(type) {
    return await Campaign.findAll({ type });
  }

  // Get campaigns by date range
  async getCampaignsByDateRange(startDate, endDate) {
    const campaignInstance = new Campaign();
    return await campaignInstance.executeQuery(`
      SELECT * FROM campaigns 
      WHERE (start_date BETWEEN ? AND ?) 
      OR (end_date BETWEEN ? AND ?) 
      OR (start_date <= ? AND end_date >= ?)
      ORDER BY start_date ASC
    `, [startDate, endDate, startDate, endDate, startDate, endDate]);
  }

  // Search campaigns
  async searchCampaigns(searchTerm, limit = 10) {
    const campaignInstance = new Campaign();
    const query = `
      SELECT id, name, type, status, start_date, end_date
      FROM campaigns 
      WHERE name LIKE ? OR description LIKE ? OR type LIKE ?
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await campaignInstance.executeQuery(query, [searchPattern, searchPattern, searchPattern, limit]);
  }

  // Get campaign performance metrics
  async getCampaignPerformance(campaignId) {
    const campaignInstance = new Campaign();
    // This would integrate with sales/analytics data
    // For now, return basic campaign info
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      campaign_id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      // Placeholder for actual metrics
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0
    };
  }

  // Start campaign
  async startCampaign(campaignId) {
    try {
      const campaignModel = new Campaign();
      const campaign = await campaignModel.findById(campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === 'active') {
        throw new Error('Campaign is already active');
      }

      // Update campaign status to active
      const updatedCampaign = await campaignModel.updateById(campaignId, {
        status: 'active',
        started_at: new Date(),
        updated_at: new Date()
      });

      return updatedCampaign;
    } catch (error) {
      console.error('Start campaign error:', error);
      throw error;
    }
  }

  // Pause campaign
  async pauseCampaign(campaignId) {
    try {
      const campaignModel = new Campaign();
      const campaign = await campaignModel.findById(campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status !== 'active') {
        throw new Error('Only active campaigns can be paused');
      }

      // Update campaign status to paused
      const updatedCampaign = await campaignModel.updateById(campaignId, {
        status: 'paused',
        paused_at: new Date(),
        updated_at: new Date()
      });

      return updatedCampaign;
    } catch (error) {
      console.error('Pause campaign error:', error);
      throw error;
    }
  }

  // Stop campaign
  async stopCampaign(campaignId) {
    try {
      const campaignModel = new Campaign();
      const campaign = await campaignModel.findById(campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === 'completed') {
        throw new Error('Campaign is already completed');
      }

      // Update campaign status to completed
      const updatedCampaign = await campaignModel.updateById(campaignId, {
        status: 'completed',
        completed_at: new Date(),
        updated_at: new Date()
      });

      return updatedCampaign;
    } catch (error) {
      console.error('Stop campaign error:', error);
      throw error;
    }
  }

  // Get campaign statistics by ID
  async getCampaignStatsById(campaignId) {
    try {
      const campaignModel = new Campaign();
      const campaign = await campaignModel.findById(campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get campaign-specific statistics
      const stats = {
        campaign_id: campaignId,
        campaign_name: campaign.name,
        status: campaign.status,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        total_impressions: 0, // Placeholder
        total_clicks: 0, // Placeholder
        total_conversions: 0, // Placeholder
        total_revenue: 0, // Placeholder
        click_through_rate: 0, // Placeholder
        conversion_rate: 0, // Placeholder
        cost_per_click: 0, // Placeholder
        return_on_investment: 0 // Placeholder
      };

      return stats;
    } catch (error) {
      console.error('Get campaign stats by ID error:', error);
      throw error;
    }
  }
}

module.exports = new CampaignController(); 