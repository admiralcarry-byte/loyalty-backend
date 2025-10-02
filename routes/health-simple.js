const express = require('express');

const router = express.Router();

// @route   GET /api/health
// @desc    Simple health check for Railway
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Always return success for Railway health checks
    // Don't depend on database connection for basic health check
    res.status(200).json({
      success: true,
      status: 'OK',
      message: 'ÁGUA TWEZAH Admin Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: '1.0.0',
      apiVersion: 'v1',
      service: 'backend'
    });
  } catch (error) {
    console.error('Health check error:', error);
    // Even on error, return 200 for Railway health check
    // Railway will retry if the service is actually down
    res.status(200).json({
      success: false,
      status: 'degraded',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      service: 'backend'
    });
  }
});

// @route   GET /api/health/db
// @desc    Database health check
// @access  Public
router.get('/db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const isHealthy = connectionState === 1; // Only healthy if connected

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'OK' : 'unhealthy',
      message: `Database ${isHealthy ? 'is connected' : 'connection issue'}`,
      timestamp: new Date().toISOString(),
      database: {
        type: 'MongoDB',
        status: connectionStates[connectionState] || 'unknown',
        readyState: connectionState,
        healthy: isHealthy
      }
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database health check failed',
      timestamp: new Date().toISOString(),
      database: {
        type: 'MongoDB',
        status: 'error',
        error: error.message
      }
    });
  }
});

module.exports = router;