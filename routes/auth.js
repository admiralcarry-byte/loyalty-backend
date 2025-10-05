const express = require('express');
const { body, validationResult } = require('express-validator');
const { authController } = require('../controllers');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    const result = await authController.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number')
], async (req, res) => {
  try {
    const result = await authController.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/auth/admin-registration-status
// @desc    Check if admin registration is enabled
// @access  Public
router.get('/admin-registration-status', async (req, res) => {
  try {
    const isEnabled = await authController.isAdminRegistrationEnabled();
    
    res.json({
      success: true,
      data: {
        enabled: isEnabled,
        message: isEnabled 
          ? 'Admin registration is available' 
          : 'Admin registration is disabled. An administrator already exists on this platform.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/auth/register-admin
// @desc    Register new admin user
// @access  Public (only available when no admin exists)
router.post('/register-admin', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional({ nullable: true, checkFalsy: true }).isLength({ min: 5, max: 20 }).withMessage('Phone number must be between 5 and 20 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const result = await authController.registerAdmin(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Admin registration successful',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authController.refreshToken(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', [verifyToken], async (req, res) => {
  try {
    const result = await authController.logout(req.user.userId);
    
    res.json({
      success: true,
      message: 'Logout successful',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', [verifyToken], async (req, res) => {
  try {
    // req.user is already the full user object from middleware
    const user = await authController.getProfile(req.user._id || req.user.id);
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  verifyToken,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authController.changePassword(req.user.userId, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/auth/my-level-progress
// @desc    Get current user's loyalty level and progress to next level
// @access  Private (Any authenticated user)
router.get('/my-level-progress', [verifyToken], async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    
    // Import models
    const User = require('../models/User');
    const TierRequirement = require('../models/TierRequirement');
    const userModel = new User();
    const tierRequirementModel = new TierRequirement();
    
    // Get current user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get current level requirements
    const activeRequirements = await tierRequirementModel.getActiveRequirements();
    const currentLevel = activeRequirements.find(req => req.tier === (user.loyalty_tier || 'lead'));
    if (!currentLevel) {
      return res.status(404).json({
        success: false,
        message: 'Current loyalty level not found'
      });
    }
    
    // Get next level
    const sortedRequirements = activeRequirements.sort((a, b) => a.minimum_liters - b.minimum_liters);
    const currentLevelIndex = sortedRequirements.findIndex(req => req.tier === user.loyalty_tier);
    const nextLevel = currentLevelIndex >= 0 && currentLevelIndex < sortedRequirements.length - 1 
      ? sortedRequirements[currentLevelIndex + 1] 
      : null;
    
    // Calculate progress
    const currentLiters = user.total_liters || 0;
    const currentLevelMinLiters = currentLevel.minimum_liters || 0;
    const nextLevelMinLiters = nextLevel?.minimum_liters || currentLevelMinLiters;
    
    // Calculate percentage progress
    let progressPercentage = 0;
    let litersCompleted = 0;
    let litersRemaining = 0;
    
    if (nextLevel) {
      // Calculate progress within the range
      const rangeStart = currentLevelMinLiters;
      const rangeEnd = nextLevelMinLiters;
      const rangeTotal = rangeEnd - rangeStart;
      const currentProgress = currentLiters - rangeStart;
      
      progressPercentage = rangeTotal > 0 ? Math.min((currentProgress / rangeTotal) * 100, 100) : 0;
      litersCompleted = Math.max(currentProgress, 0);
      litersRemaining = Math.max(rangeEnd - currentLiters, 0);
    } else {
      // Already at max level
      progressPercentage = 100;
      litersCompleted = currentLiters;
      litersRemaining = 0;
    }
    
    res.json({
      success: true,
      data: {
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          total_liters: currentLiters,
          total_purchases: user.total_purchases || 0,
          points_balance: user.points_balance || 0
        },
        currentLevel: {
          name: currentLevel.display_name || currentLevel.tier_name,
          tier: currentLevel.tier,
          level_number: currentLevel.level_number || 1,
          description: currentLevel.description,
          color: currentLevel.color,
          icon: currentLevel.icon,
          requirements: {
            minimum_liters: currentLevel.minimum_liters,
            minimum_points: currentLevel.minimum_points
          },
          benefits: {
            discount_percentage: 5, // Default for now
            priority_support: true // Default for now
          }
        },
        nextLevel: nextLevel ? {
          name: nextLevel.display_name || nextLevel.tier_name,
          tier: nextLevel.tier,
          level_number: nextLevel.level_number || 2,
          description: nextLevel.description,
          color: nextLevel.color,
          icon: nextLevel.icon,
          requirements: {
            minimum_liters: nextLevel.minimum_liters,
            minimum_points: nextLevel.minimum_points
          },
          benefits: {
            discount_percentage: 5, // Default for now
            priority_support: true // Default for now
          }
        } : null,
        progress: {
          currentLiters,
          targetLiters: nextLevelMinLiters,
          litersCompleted,
          litersRemaining,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          isMaxLevel: !nextLevel
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching level progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch level progress',
      error: error.message
    });
  }
});

module.exports = router; 