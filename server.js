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
const commissionRoutes = require('./routes/commissions');
const commissionSettingsRoutes = require('./routes/commissionSettings');
const commissionRulesRoutes = require('./routes/commissionRules');
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
const healthRoutes = require('./routes/health');
const searchRoutes = require('./routes/search');
const bulkRoutes = require('./routes/bulk');
const dashboardRoutes = require('./routes/dashboard');
const bankDetailsRoutes = require('./routes/bankDetails');
const influencerLevelsRoutes = require('./routes/influencerLevels');
const aiInsightsRoutes = require('./routes/aiInsights');
const payoutRequestRoutes = require('./routes/payoutRequests');
const activityLogsRoutes = require('./routes/activityLogs');
const systemStatsRoutes = require('./routes/systemStats');
const generalSettingsRoutes = require('./routes/generalSettings');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
database.connect().then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',') : 
  ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:5173', 'https://loyalty-frontend.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint is handled by healthRoutes at /api/health

// API routes
const apiPrefix = process.env.API_PREFIX || '/api';

// Add fallback routes for frontend compatibility (without /v1)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/commission-settings', commissionSettingsRoutes);
app.use('/api/commission-rules', commissionRulesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/cashback', cashbackRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/online-purchases', onlinePurchaseRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bank-details', bankDetailsRoutes);
app.use('/api/influencer-levels', influencerLevelsRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);
app.use('/api/payout-requests', payoutRequestRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/system-stats', systemStatsRoutes);
app.use('/api/general-settings', generalSettingsRoutes);

// Main API routes with version prefix
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);
app.use(`${apiPrefix}/stores`, storeRoutes);
app.use(`${apiPrefix}/campaigns`, campaignRoutes);
app.use(`${apiPrefix}/sales`, salesRoutes);
app.use(`${apiPrefix}/commissions`, commissionRoutes);
app.use(`${apiPrefix}/commission-settings`, commissionSettingsRoutes);
app.use(`${apiPrefix}/commission-rules`, commissionRulesRoutes);
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
app.use(`${apiPrefix}/ai-insights`, aiInsightsRoutes);
app.use(`${apiPrefix}/payout-requests`, payoutRequestRoutes);
app.use(`${apiPrefix}/activity-logs`, activityLogsRoutes);
app.use(`${apiPrefix}/system-stats`, systemStatsRoutes);
app.use(`${apiPrefix}/general-settings`, generalSettingsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});



// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}${apiPrefix}/docs`);
  console.log(`🗄️  Database: MongoDB`);
});

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