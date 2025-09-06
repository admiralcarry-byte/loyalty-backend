const express = require('express');
const router = express.Router();
const generalSettingsService = require('../services/generalSettingsService');
const { verifyToken } = require('../middleware/auth');

// Get general settings
router.get('/', async (req, res) => {
  try {
    const result = await generalSettingsService.getGeneralSettings();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in general settings GET route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update general settings
router.put('/', async (req, res) => {
  try {
    const result = await generalSettingsService.updateGeneralSettings(req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in general settings PUT route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;