#!/usr/bin/env node

/**
 * Production startup script for Railway deployment
 * Loads all routes with proper error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');
const fontHelper = require('./utils/fontHelper');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sellerRoutes = require('./routes/sellers');
const adminRoutes = require('./routes/admin');
const storeRoutes = require('./routes/stores');
const campaignRoutes = require('./routes/campaigns');
const salesRoutes = require('./routes/sales');
const commissionSettingsRoutes = require('./routes/commissionSettings');
const commissionRulesRoutes = require('./routes/commissionRules');
const commissionRoutes = require('./routes/commissions');
const billingRoutes = require('./routes/billing');
const notificationRoutes = require('./routes/notifications');
const reportsRoutes = require('./routes/reports');
const pointsRoutes = require('./routes/points');
const cashbackRoutes = require('./routes/cashback');
const purchaseRoutes = require('./routes/purchases');
const onlinePurchaseRoutes = require('./routes/online-purchases');
const walletRoutes = require('./routes/wallets');
const auditRoutes = require('./routes/audit');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const healthRoutes = require('./routes/health-simple');
const searchRoutes = require('./routes/search');
const bulkRoutes = require('./routes/bulk');
const dashboardRoutes = require('./routes/dashboard');
const bankDetailsRoutes = require('./routes/bankDetails');
const influencerLevelsRoutes = require('./routes/influencerLevels');
const loyaltyLevelsRoutes = require('./routes/loyaltyLevels');
const payoutRequestRoutes = require('./routes/payoutRequests');
const activityLogsRoutes = require('./routes/activityLogs');
const systemStatsRoutes = require('./routes/systemStats');
const generalSettingsRoutes = require('./routes/generalSettings');
const tierRequirementsRoutes = require('./routes/tierRequirements');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const getCorsOrigins = () => {
  const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081'
  ];

  const productionOrigins = [
    'https://loyalty-frontend.netlify.app',
    'https://loyalty-admin.netlify.app',
    'https://loyalty-backend-production-8e32.up.railway.app'
  ];

  const envCorsOrigin = process.env.CORS_ORIGIN;
  if (envCorsOrigin) {
    const envOrigins = envCorsOrigin.split(',').map(origin => origin.trim());
    return [...baseOrigins, ...productionOrigins, ...envOrigins];
  }

  return [...baseOrigins, ...productionOrigins];
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getCorsOrigins();
    
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

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const allowedOrigins = getCorsOrigins();
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins,
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

// Log CORS configuration
console.log('🔒 CORS Configuration:');
console.log('   Allowed Origins:', getCorsOrigins());
console.log('   Environment CORS Origin:', process.env.CORS_ORIGIN || 'Not set');

// API routes with version prefix
const apiPrefix = process.env.API_PREFIX || '/api';

console.log('🔄 Setting up API routes...');

// Main API routes
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/sellers`, sellerRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);
app.use(`${apiPrefix}/stores`, storeRoutes);
app.use(`${apiPrefix}/campaigns`, campaignRoutes);
app.use(`${apiPrefix}/sales`, salesRoutes);
app.use(`${apiPrefix}/commission-settings`, commissionSettingsRoutes);
app.use(`${apiPrefix}/commission-rules`, commissionRulesRoutes);
app.use(`${apiPrefix}/commissions`, commissionRoutes);
app.use(`${apiPrefix}/billing`, billingRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/reports`, reportsRoutes);
app.use(`${apiPrefix}/points`, pointsRoutes);
app.use(`${apiPrefix}/cashback`, cashbackRoutes);
app.use(`${apiPrefix}/purchases`, purchaseRoutes);
app.use(`${apiPrefix}/online-purchases`, onlinePurchaseRoutes);
app.use(`${apiPrefix}/wallets`, walletRoutes);
app.use(`${apiPrefix}/audit`, auditRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/export`, exportRoutes);
app.use(`${apiPrefix}/health`, healthRoutes);
app.use(`${apiPrefix}/search`, searchRoutes);
app.use(`${apiPrefix}/bulk`, bulkRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/bank-details`, bankDetailsRoutes);
app.use(`${apiPrefix}/influencer-levels`, influencerLevelsRoutes);
app.use(`${apiPrefix}/loyalty-levels`, loyaltyLevelsRoutes);
app.use(`${apiPrefix}/payout-requests`, payoutRequestRoutes);
app.use(`${apiPrefix}/activity-logs`, activityLogsRoutes);
app.use(`${apiPrefix}/system-stats`, systemStatsRoutes);
app.use(`${apiPrefix}/general-settings`, generalSettingsRoutes);
app.use(`${apiPrefix}/tier-requirements`, tierRequirementsRoutes);

console.log('✅ All versioned routes loaded');

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
    // Initialize font helper asynchronously (non-blocking)
    fontHelper.initialize().catch(err => {
      console.warn('Font helper initialization failed:', err.message);
    });
    
    console.log('🔄 Starting database connection...');
    await database.connect();
    console.log('✅ MongoDB connected successfully');
    
    console.log('🔄 Starting server...');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🗄️  Database: MongoDB`);
      console.log(`✅ Server startup complete!`);
    }).on('error', (err) => {
      console.error('❌ Server startup error:', err);
      process.exit(1);
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
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

module.exports = app;