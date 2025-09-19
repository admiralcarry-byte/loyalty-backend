const express = require('express');
const { User, Product, Store, Sale } = require('../models');

const router = express.Router();

// @route   GET /api/health
// @desc    Basic health check
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

// @route   GET /api/health/detailed
// @desc    Detailed health check
// @access  Public
router.get('/detailed', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const healthData = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        type: 'MongoDB',
        status: connectionStates[connectionState] || 'unknown',
        readyState: connectionState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      services: {
        api: 'healthy',
        database: connectionState === 1 ? 'healthy' : 'unhealthy'
      },
      version: '1.0.0',
      apiVersion: 'v1'
    };

    res.json(healthData);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString()
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

// @route   GET /api/health/redis
// @desc    Redis health check
// @access  Private
router.get('/redis', async (req, res) => {
  try {
    // For now, return healthy status since Redis is not implemented
    // In a real implementation, you would test Redis connection here
    res.json({
      success: true,
      status: 'healthy',
      redis: 'not_implemented',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      redis: 'disconnected',
      error: 'Redis health check failed'
    });
  }
});

// @route   GET /api/health/external
// @desc    External services health check
// @access  Private
router.get('/external', async (req, res) => {
  try {
    // Check external services (payment gateways, email services, etc.)
    const externalServices = {
      payment_gateway: 'healthy', // In real implementation, test actual payment gateway
      email_service: 'healthy',   // In real implementation, test actual email service
      sms_service: 'healthy'      // In real implementation, test actual SMS service
    };

    const allHealthy = Object.values(externalServices).every(status => status === 'healthy');

    res.json({
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'unhealthy',
      services: externalServices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('External services health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'External services health check failed'
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
      if (User && typeof User.count === 'function') {
        const userCount = await User.count();
        healthChecks.users = { status: 'healthy', count: userCount };
      } else {
        healthChecks.users = { status: 'unhealthy', error: 'User model not available' };
      }
    } catch (error) {
      healthChecks.users = { status: 'unhealthy', error: error.message };
    }

    // Test Product model
    try {
      if (Product && typeof Product.count === 'function') {
        const productCount = await Product.count();
        healthChecks.products = { status: 'healthy', count: productCount };
      } else {
        healthChecks.products = { status: 'unhealthy', error: 'Product model not available' };
      }
    } catch (error) {
      healthChecks.products = { status: 'unhealthy', error: error.message };
    }

    // Test Store model
    try {
      if (Store && typeof Store.count === 'function') {
        const storeCount = await Store.count();
        healthChecks.stores = { status: 'healthy', count: storeCount };
      } else {
        healthChecks.stores = { status: 'unhealthy', error: 'Store model not available' };
      }
    } catch (error) {
      healthChecks.stores = { status: 'unhealthy', error: error.message };
    }

    // Test Sale model
    try {
      if (Sale && typeof Sale.count === 'function') {
        const saleCount = await Sale.count();
        healthChecks.sales = { status: 'healthy', count: saleCount };
      } else {
        healthChecks.sales = { status: 'unhealthy', error: 'Sale model not available' };
      }
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
      
      if (User && typeof User.count === 'function') {
        const userCount = await User.count();
        modelChecks.users = { status: 'healthy', count: userCount };
      } else {
        modelChecks.users = { status: 'unhealthy', error: 'User model not available' };
      }
      
      if (Product && typeof Product.count === 'function') {
        const productCount = await Product.count();
        modelChecks.products = { status: 'healthy', count: productCount };
      } else {
        modelChecks.products = { status: 'unhealthy', error: 'Product model not available' };
      }
      
      if (Store && typeof Store.count === 'function') {
        const storeCount = await Store.count();
        modelChecks.stores = { status: 'healthy', count: storeCount };
      } else {
        modelChecks.stores = { status: 'unhealthy', error: 'Store model not available' };
      }
      
      if (Sale && typeof Sale.count === 'function') {
        const saleCount = await Sale.count();
        modelChecks.sales = { status: 'healthy', count: saleCount };
      } else {
        modelChecks.sales = { status: 'unhealthy', error: 'Sale model not available' };
      }

      const allModelsHealthy = Object.values(modelChecks).every(check => check.status === 'healthy');
      healthReport.models = { status: allModelsHealthy ? 'healthy' : 'unhealthy', details: modelChecks };
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