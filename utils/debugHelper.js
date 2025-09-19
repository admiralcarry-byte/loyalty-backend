// Debug helper utilities for backend debugging

class DebugHelper {
  // Log API request details
  static logApiRequest(req, res, next) {
    const startTime = Date.now();
    
    // Log request details
    console.log(`\n🔍 API Request Debug:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   URL: ${req.originalUrl}`);
    console.log(`   Headers:`, {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [HIDDEN]' : 'None',
      'user-agent': req.headers['user-agent']
    });
    console.log(`   Query:`, req.query);
    console.log(`   Body:`, req.body);
    console.log(`   User:`, req.user ? { id: req.user.id, role: req.user.role } : 'None');
    
    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      console.log(`   Response (${duration}ms):`, {
        success: data?.success,
        dataType: typeof data?.data,
        dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
        error: data?.error || 'None'
      });
      return originalJson.call(this, data);
    };
    
    next();
  }

  // Log database query details
  static logDatabaseQuery(model, operation, query, result) {
    console.log(`\n🗄️  Database Query Debug:`);
    console.log(`   Model: ${model}`);
    console.log(`   Operation: ${operation}`);
    console.log(`   Query:`, query);
    console.log(`   Result Type: ${typeof result}`);
    console.log(`   Result Length: ${Array.isArray(result) ? result.length : 'N/A'}`);
    console.log(`   Success: ${result !== null && result !== undefined}`);
  }

  // Log error details
  static logError(error, context = '') {
    console.log(`\n❌ Error Debug ${context ? `(${context})` : ''}:`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    console.log(`   Type: ${error.constructor.name}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
  }

  // Log data validation issues
  static logDataValidation(data, expectedStructure, path = '') {
    console.log(`\n🔍 Data Validation Debug:`);
    console.log(`   Path: ${path || 'root'}`);
    console.log(`   Data Type: ${typeof data}`);
    console.log(`   Data:`, data);
    console.log(`   Expected:`, expectedStructure);
    
    if (typeof data !== typeof expectedStructure) {
      console.log(`   ❌ Type mismatch: expected ${typeof expectedStructure}, got ${typeof data}`);
    }
  }

  // Log authentication details
  static logAuth(req) {
    console.log(`\n🔐 Authentication Debug:`);
    console.log(`   Token Present: ${!!req.headers.authorization}`);
    console.log(`   User:`, req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      status: req.user.status
    } : 'None');
  }

  // Log performance metrics
  static logPerformance(operation, startTime, endTime, details = {}) {
    const duration = endTime - startTime;
    console.log(`\n⏱️  Performance Debug:`);
    console.log(`   Operation: ${operation}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Details:`, details);
    
    if (duration > 1000) {
      console.log(`   ⚠️  Slow operation detected (>1s)`);
    }
  }

  // Log memory usage
  static logMemoryUsage() {
    const usage = process.memoryUsage();
    console.log(`\n💾 Memory Usage Debug:`);
    console.log(`   RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`);
    console.log(`   Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    console.log(`   Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`);
    console.log(`   External: ${Math.round(usage.external / 1024 / 1024)}MB`);
  }

  // Log database connection status
  static logDatabaseStatus() {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    console.log(`\n🗄️  Database Status Debug:`);
    console.log(`   State: ${connectionStates[connectionState]} (${connectionState})`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Name: ${mongoose.connection.name}`);
  }

  // Log API endpoint statistics
  static logEndpointStats() {
    console.log(`\n📊 API Endpoint Statistics:`);
    console.log(`   Uptime: ${process.uptime()}s`);
    console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`   PID: ${process.pid}`);
    console.log(`   Node Version: ${process.version}`);
  }

  // Enable debug mode
  static enableDebugMode() {
    console.log(`\n🐛 Debug mode enabled`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Log current configuration
    this.logDatabaseStatus();
    this.logMemoryUsage();
    this.logEndpointStats();
  }

  // Disable debug mode
  static disableDebugMode() {
    console.log(`\n🐛 Debug mode disabled`);
  }
}

module.exports = DebugHelper;