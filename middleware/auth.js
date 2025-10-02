const jwt = require('jsonwebtoken');
const { User } = require('../models');
const Seller = require('../schemas/Seller');

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
    
    // Check if this is a seller token or user token
    if (decoded.sellerId) {
      // This is a seller token
      const seller = await Seller.findById(decoded.sellerId);

      if (!seller) {
        return res.status(401).json({
          success: false,
          error: 'Seller not found',
          message: 'Seller associated with token does not exist'
        });
      }

      // Check if seller is active
      if (seller.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Account is not active',
          message: `Account status: ${seller.status}`
        });
      }

      // Create a user-like object for sellers
      req.user = {
        _id: seller._id,
        email: seller.email,
        role: 'seller',
        status: seller.status,
        store_number: seller.store_number
      };
    } else if (decoded.userId) {
      // This is a regular user token
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
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token does not contain valid user or seller ID'
      });
    }

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
      console.log(`Access denied: User role "${req.user.role}" not in allowed roles [${roles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Your role (${req.user.role}) does not have access to this resource. Required: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole('admin');

// Check if user is manager, admin, or seller
const requireManager = requireRole('admin', 'manager', 'seller');

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