const express = require('express');
const router = express.Router();
const systemStatsService = require('../services/systemStatsService');

// Get system statistics
router.get('/', async (req, res) => {
  try {
    const result = await systemStatsService.getSystemStats();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in system stats route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update system statistics
router.post('/update', async (req, res) => {
  try {
    const result = await systemStatsService.updateSystemStats();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error updating system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;