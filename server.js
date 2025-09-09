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
const payoutRequestRoutes = require('./routes/payoutRequests');
const activityLogsRoutes = require('./routes/activityLogs');
const systemStatsRoutes = require('./routes/systemStats');
const generalSettingsRoutes = require('./routes/generalSettings');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Function to find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Function to start the server
async function startServer() {
  try {
    console.log('🔄 Starting database connection...');
    await database.connect();
    console.log('✅ MongoDB connected successfully');
    
    console.log('🔄 Finding available port...');
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      console.log(`⚠️  Port ${PORT} is in use, using port ${availablePort} instead`);
    }
    
    console.log('🔄 Starting server...');
    app.listen(availablePort, () => {
      console.log(`🚀 Server running on port ${availablePort}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${availablePort}/health`);
      console.log(`📚 API Documentation: http://localhost:${availablePort}/api/docs`);
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

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'https://loyalty-frontend.netlify.app',
    'https://loyalty-admin.netlify.app'
  ],   
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security middleware - after CORS
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));
// app.use(compression());
// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

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
console.log('🔄 Setting up API routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes loaded');
app.use('/api/users', userRoutes);
console.log('✅ User routes loaded');
app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes loaded');
app.use('/api/stores', storeRoutes);
console.log('✅ Store routes loaded');
app.use('/api/campaigns', campaignRoutes);
console.log('✅ Campaign routes loaded');
app.use('/api/sales', salesRoutes);
console.log('✅ Sales routes loaded');
app.use('/api/commissions', commissionRoutes);
console.log('✅ Commission routes loaded');
app.use('/api/commission-settings', commissionSettingsRoutes);
console.log('✅ Commission settings routes loaded');
app.use('/api/commission-rules', commissionRulesRoutes);
console.log('✅ Commission rules routes loaded');
app.use('/api/billing', billingRoutes);
console.log('✅ Billing routes loaded');
app.use('/api/notifications', notificationRoutes);
console.log('✅ Notification routes loaded');
app.use('/api/reports', reportsRoutes);
console.log('✅ Report routes loaded');
app.use('/api/points', pointsRoutes);
console.log('✅ Points routes loaded');
app.use('/api/cashback', cashbackRoutes);
console.log('✅ Cashback routes loaded');
app.use('/api/purchases', purchaseRoutes);
console.log('✅ Purchase routes loaded');
app.use('/api/online-purchases', onlinePurchaseRoutes);
console.log('✅ Online purchase routes loaded');
app.use('/api/wallets', walletRoutes);
console.log('✅ Wallet routes loaded');
app.use('/api/audit', auditRoutes);
console.log('✅ Audit routes loaded');
app.use('/api/analytics', analyticsRoutes);
console.log('✅ Analytics routes loaded');
app.use('/api/export', exportRoutes);
console.log('✅ Export routes loaded');
app.use('/api/health', healthRoutes);
console.log('✅ Health routes loaded');
app.use('/api/search', searchRoutes);
console.log('✅ Search routes loaded');
app.use('/api/bulk', bulkRoutes);
console.log('✅ Bulk routes loaded');
app.use('/api/dashboard', dashboardRoutes);
console.log('✅ Dashboard routes loaded');
app.use('/api/bank-details', bankDetailsRoutes);
console.log('✅ Bank details routes loaded');
app.use('/api/influencer-levels', influencerLevelsRoutes);
console.log('✅ Influencer levels routes loaded');
app.use('/api/payout-requests', payoutRequestRoutes);
console.log('✅ Payout request routes loaded');
app.use('/api/activity-logs', activityLogsRoutes);
console.log('✅ Activity log routes loaded');
app.use('/api/system-stats', systemStatsRoutes);
console.log('✅ System stats routes loaded');
app.use('/api/general-settings', generalSettingsRoutes);
console.log('✅ General settings routes loaded');

// Main API routes with version prefix
console.log('🔄 Setting up versioned API routes...');
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
app.use(`${apiPrefix}/payout-requests`, payoutRequestRoutes);
app.use(`${apiPrefix}/activity-logs`, activityLogsRoutes);
app.use(`${apiPrefix}/system-stats`, systemStatsRoutes);
app.use(`${apiPrefix}/general-settings`, generalSettingsRoutes);
console.log('✅ All versioned routes loaded');

// 404 handler
console.log('🔄 Setting up 404 handler...');
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});
console.log('✅ 404 handler loaded');

// Error handling middleware
console.log('🔄 Setting up error handler...');
app.use(errorHandler);
console.log('✅ Error handler loaded');

// Server startup is now handled in the startServer() function above

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