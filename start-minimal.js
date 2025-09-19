#!/usr/bin/env node

/**
 * Minimal startup script for Railway deployment
 * This script starts the server without font helper dependencies
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
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
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'https://loyalty-frontend.netlify.app',
    'https://loyalty-admin.netlify.app',
    'https://loyalty-backend-production-8e32.up.railway.app'
  ],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check route
app.use('/api/health', healthRoutes);

// API routes with version prefix
const apiPrefix = process.env.API_PREFIX || '/api';

// Main API routes
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
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

// Basic root route
app.get('/', (req, res) => {
  res.json({
    message: 'ÁGUA TWEZAH Admin Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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
    console.log('🔄 Starting minimal server...');
    
    console.log('🔄 Starting database connection...');
    await database.connect();
    console.log('✅ MongoDB connected successfully');
    
    console.log('🔄 Starting server...');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`✅ Minimal server startup complete!`);
    }).on('error', (err) => {
      console.error('❌ Server startup error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

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

// Start the server
startServer();