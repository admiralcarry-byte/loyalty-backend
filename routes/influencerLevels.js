const express = require('express');
const router = express.Router();
const InfluencerLevel = require('../models/InfluencerLevel');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get all influencer levels
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const levels = await InfluencerLevel.getAllLevels();
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching influencer levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer levels',
      error: error.message
    });
  }
});

// Get influencer levels with statistics
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const levels = await InfluencerLevel.getLevelStats();
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching influencer level stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer level statistics',
      error: error.message
    });
  }
});

// Get influencer statistics
router.get('/influencer-stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await InfluencerLevel.getInfluencerStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching influencer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer statistics',
      error: error.message
    });
  }
});

// Get promotion candidates
router.get('/promotion-candidates', verifyToken, requireAdmin, async (req, res) => {
  try {
    const candidates = await InfluencerLevel.getPromotionCandidates();
    
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('Error fetching promotion candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion candidates',
      error: error.message
    });
  }
});

// Get influencer level by ID
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const level = await InfluencerLevel.findById(req.params.id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Influencer level not found'
      });
    }

    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error('Error fetching influencer level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer level',
      error: error.message
    });
  }
});

// Create new influencer level
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const level = await InfluencerLevel.createInfluencerLevel(req.body);
    
    res.status(201).json({
      success: true,
      data: level,
      message: 'Influencer level created successfully'
    });
  } catch (error) {
    console.error('Error creating influencer level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create influencer level',
      error: error.message
    });
  }
});

// Update influencer level
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const level = await InfluencerLevel.updateInfluencerLevel(req.params.id, req.body);
    
    res.json({
      success: true,
      data: level,
      message: 'Influencer level updated successfully'
    });
  } catch (error) {
    console.error('Error updating influencer level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update influencer level',
      error: error.message
    });
  }
});

// Deactivate influencer level
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await InfluencerLevel.deactivateLevel(req.params.id);
    
    res.json({
      success: true,
      message: 'Influencer level deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating influencer level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate influencer level',
      error: error.message
    });
  }
});

module.exports = router;