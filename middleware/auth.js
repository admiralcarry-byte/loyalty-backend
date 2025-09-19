const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Create User instance
const userModel = new User();

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Token not provided in authorization header'
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user from database
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User associated with token does not exist'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        message: `Account status: ${user.status}`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token format is invalid or corrupted'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please refresh your session or log in again'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole('admin');

// Check if user is manager or admin
const requireManager = requireRole('admin', 'manager');

// Check if user is staff or higher
const requireStaff = requireRole('admin', 'manager', 'staff');

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await userModel.findById(decoded.userId);

    if (user && user.status === 'active') {
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail on token errors for optional auth
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireManager,
  requireStaff,
  optionalAuth
}; 