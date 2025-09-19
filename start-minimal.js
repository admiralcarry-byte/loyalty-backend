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
const healthRoutes = require('./routes/health-simple');
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