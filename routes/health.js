const express = require('express');
const { User, Product, Store, Sale } = require('../models');
const { getMongoose } = require('../config/database');

const router = express.Router();

// @route   GET /api/health
// @desc    Basic health check
// @access  Public
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'OK',
      message: 'ÁGUA TWEZAH Admin Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'MongoDB',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// @route   GET /api/health/database
// @desc    Database health check
// @access  Private
router.get('/database', async (req, res) => {
  try {
    // Test MongoDB connection
    const mongoose = getMongoose();
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) { // 1 = connected
      res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Database connection test failed');
    }
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: 'Database health check failed'
    });
  }
});

// @route   GET /api/health/models
// @desc    Model health check
// @access  Private
router.get('/models', async (req, res) => {
  try {
    const healthChecks = {};

    // Test User model
    try {
      const userCount = await User.count();
      healthChecks.users = { status: 'healthy', count: userCount };
    } catch (error) {
      healthChecks.users = { status: 'unhealthy', error: error.message };
    }

    // Test Product model
    try {
      const productCount = await Product.count();
      healthChecks.products = { status: 'healthy', count: productCount };
    } catch (error) {
      healthChecks.products = { status: 'unhealthy', error: error.message };
    }

    // Test Store model
    try {
      const storeCount = await Store.count();
      healthChecks.stores = { status: 'healthy', count: storeCount };
    } catch (error) {
      healthChecks.stores = { status: 'unhealthy', error: error.message };
    }

    // Test Sale model
    try {
      const saleCount = await Sale.count();
      healthChecks.sales = { status: 'healthy', count: saleCount };
    } catch (error) {
      healthChecks.sales = { status: 'unhealthy', error: error.message };
    }

    const allHealthy = Object.values(healthChecks).every(check => check.status === 'healthy');

    res.json({
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'unhealthy',
      models: healthChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Models health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Models health check failed'
    });
  }
});

// @route   GET /api/health/full
// @desc    Full system health check
// @access  Private
router.get('/full', async (req, res) => {
  try {
    const healthReport = {
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      database: { status: 'unknown' },
      models: { status: 'unknown' }
    };

    // Test database
    try {
      const mongoose = getMongoose();
      const connectionState = mongoose.connection.readyState;
      if (connectionState === 1) {
        healthReport.database = { status: 'healthy' };
      } else {
        healthReport.database = { status: 'unhealthy', error: 'Connection not ready' };
      }
    } catch (error) {
      healthReport.database = { status: 'unhealthy', error: error.message };
    }

    // Test models
    try {
      const modelChecks = {};
      
      const userCount = await User.count();
      modelChecks.users = { status: 'healthy', count: userCount };
      
      const productCount = await Product.count();
      modelChecks.products = { status: 'healthy', count: productCount };
      
      const storeCount = await Store.count();
      modelChecks.stores = { status: 'healthy', count: storeCount };
      
      const saleCount = await Sale.count();
      modelChecks.sales = { status: 'healthy', count: saleCount };

      healthReport.models = { status: 'healthy', details: modelChecks };
    } catch (error) {
      healthReport.models = { status: 'unhealthy', error: error.message };
    }

    const overallStatus = healthReport.database.status === 'healthy' && 
                         healthReport.models.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.json({
      success: overallStatus === 'healthy',
      status: overallStatus,
      report: healthReport
    });
  } catch (error) {
    console.error('Full health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Full health check failed'
    });
  }
});

module.exports = router; 