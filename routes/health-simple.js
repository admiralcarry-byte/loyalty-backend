const express = require('express');

const router = express.Router();

// @route   GET /api/health
// @desc    Simple health check for Railway
// @access  Public
router.get('/', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      success: true,
      status: 'OK',
      message: 'ÁGUA TWEZAH Admin Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        type: 'MongoDB',
        status: connectionStates[connectionState] || 'unknown',
        readyState: connectionState
      },
      uptime: process.uptime(),
      version: '1.0.0',
      apiVersion: 'v1'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;