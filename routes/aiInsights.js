const express = require('express');
const router = express.Router();
const AIInsights = require('../models/AIInsights');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get all AI insights with pagination and filters
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      priority = 'all',
      category = 'all',
      status = 'all'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      priority,
      category,
      status
    };

    const result = await AIInsights.getAllInsights(options);
    
    res.json({
      success: true,
      data: result.insights,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights',
      error: error.message
    });
  }
});

// Get top recommendations
router.get('/top-recommendations', verifyToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recommendations = await AIInsights.getTopRecommendations(limit);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error fetching top recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top recommendations',
      error: error.message
    });
  }
});

// Get AI insights statistics
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await AIInsights.getInsightsStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching AI insights stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights statistics',
      error: error.message
    });
  }
});

// Get AI insight by ID
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const insight = await AIInsights.findById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'AI insight not found'
      });
    }

    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error fetching AI insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insight',
      error: error.message
    });
  }
});

// Create new AI insight
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const insight = await AIInsights.createAIInsight(req.body);
    
    res.status(201).json({
      success: true,
      data: insight,
      message: 'AI insight created successfully'
    });
  } catch (error) {
    console.error('Error creating AI insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI insight',
      error: error.message
    });
  }
});

// Update AI insight
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const insight = await AIInsights.updateAIInsight(req.params.id, req.body);
    
    res.json({
      success: true,
      data: insight,
      message: 'AI insight updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI insight',
      error: error.message
    });
  }
});

// Update insight status
router.post('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, implementation_date } = req.body;
    
    const insight = await AIInsights.updateInsightStatus(
      req.params.id, 
      status, 
      implementation_date
    );
    
    res.json({
      success: true,
      data: insight,
      message: 'AI insight status updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI insight status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI insight status',
      error: error.message
    });
  }
});

// Generate AI insights
router.post('/generate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const insights = await AIInsights.generateAIInsights();
    
    res.json({
      success: true,
      data: insights,
      message: 'AI insights generated successfully'
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
});

// Deactivate AI insight
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await AIInsights.deactivateInsight(req.params.id);
    
    res.json({
      success: true,
      message: 'AI insight deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating AI insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate AI insight',
      error: error.message
    });
  }
});

module.exports = router;