#!/usr/bin/env node

/**
 * Minimal startup script for Railway deployment
 * Optimized for faster startup and reduced resource usage
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');
const healthRoutes = require('./routes/health-simple');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Railway
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'https://loyalty-frontend.netlify.app',
      'https://loyalty-admin.netlify.app',
      'https://loyalty-backend-production-8e32.up.railway.app'
    ];

    // Add environment-specific CORS origins if provided
    const envCorsOrigin = process.env.CORS_ORIGIN;
    if (envCorsOrigin) {
      const envOrigins = envCorsOrigin.split(',').map(origin => origin.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middleware
app.use(cors(corsOptions));
app.use(compression());

// Rate limiting - More lenient for Railway
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint (must be available immediately)
app.get('/api/health', async (req, res) => {
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

// API routes with version prefix
const apiPrefix = process.env.API_PREFIX || '/api';

// Essential routes only for minimal startup
app.use(`${apiPrefix}/health`, healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Function to start the server
async function startServer() {
  try {
    console.log('🚀 Starting minimal server for Railway...');
    
    // Start server first (without waiting for database)
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database: MongoDB (connecting...)`);
      console.log(`✅ Minimal server startup complete!`);
    }).on('error', (err) => {
      console.error('❌ Server startup error:', err);
      process.exit(1);
    });

    // Connect to database in background (non-blocking)
    console.log('🔄 Connecting to MongoDB in background...');
    database.connect().then(() => {
      console.log('✅ MongoDB connected successfully');
    }).catch(err => {
      console.error('❌ MongoDB connection failed:', err);
      // Don't exit - server should still be available for health checks
    });
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await database.disconnect();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await database.disconnect();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
});

module.exports = app;