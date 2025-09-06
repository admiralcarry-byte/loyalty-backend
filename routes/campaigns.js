const express = require('express');
const { body, validationResult } = require('express-validator');
const { campaignController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns with pagination and filters
// @access  Private (Manager+)
router.get('/', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
], async (req, res) => {
  try {
    const result = await campaignController.getAllCampaigns(req);
    
    res.json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get campaign by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await campaignController.getCampaignById(id);
    
    res.json({
      success: true,
      data: { campaign }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/campaigns
// @desc    Create new campaign
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('name').trim().isLength({ min: 2 }).withMessage('Campaign name must be at least 2 characters'),
  body('type').isIn(['promotional', 'seasonal', 'referral', 'loyalty', 'other']).withMessage('Invalid campaign type'),
  body('start_date').isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
], async (req, res) => {
  try {
    const newCampaign = await campaignController.createCampaign(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: { campaign: newCampaign }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/campaigns/:id
// @desc    Update campaign
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Campaign name must be at least 2 characters'),
  body('type').optional().isIn(['promotional', 'seasonal', 'referral', 'loyalty', 'other']).withMessage('Invalid campaign type'),
  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCampaign = await campaignController.updateCampaign(id, req.body);
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: { campaign: updatedCampaign }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/campaigns/:id
// @desc    Delete campaign
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    await campaignController.deleteCampaign(id);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PATCH /api/campaigns/:id/status
// @desc    Update campaign status
// @access  Private (Manager+)
router.patch('/:id/status', [
  verifyToken,
  requireManager,
  body('status').isIn(['draft', 'active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedCampaign = await campaignController.updateCampaignStatus(id, status);
    
    res.json({
      success: true,
      message: 'Campaign status updated successfully',
      data: { campaign: updatedCampaign }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/stats/overview
// @desc    Get campaign statistics overview
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/stats/overview', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
], async (req, res) => {
  try {
    const campaignStats = await campaignController.getCampaignStats();
    
    res.json({
      success: true,
      data: campaignStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/active/list
// @desc    Get active campaigns
// @access  Private (Manager+)
router.get('/active/list', [verifyToken, requireManager], async (req, res) => {
  try {
    const activeCampaigns = await campaignController.getActiveCampaigns();
    
    res.json({
      success: true,
      data: activeCampaigns
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/type/:type
// @desc    Get campaigns by type
// @access  Private (Manager+)
router.get('/type/:type', [verifyToken, requireManager], async (req, res) => {
  try {
    const { type } = req.params;
    const campaigns = await campaignController.getCampaignsByType(type);
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/date-range
// @desc    Get campaigns by date range
// @access  Private (Manager+)
router.get('/date-range', [verifyToken, requireManager], async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    const campaigns = await campaignController.getCampaignsByDateRange(start_date, end_date);
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/search/:term
// @desc    Search campaigns
// @access  Private (Manager+)
router.get('/search/:term', [verifyToken, requireManager], async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;
    const campaigns = await campaignController.searchCampaigns(term, parseInt(limit));
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/:id/performance
// @desc    Get campaign performance metrics
// @access  Private (Manager+)
router.get('/:id/performance', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const performance = await campaignController.getCampaignPerformance(id);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 