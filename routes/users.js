const express = require('express');
const { body, validationResult } = require('express-validator');
const { userController } = require('../controllers');
const { verifyToken, requireAdmin, requireManager } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const userModel = new User();

// @route   GET /api/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin/Manager)
router.get('/', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const result = await userController.getAllUsers(req);
    
    res.json({
      success: true,
      data: { users: result.users },
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/users/influencer-performance
// @desc    Get influencer performance data
// @access  Private (Admin/Manager)
router.get('/influencer-performance', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const performanceData = await userController.getInfluencerPerformance();
    
    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/users/recent
// @desc    Get recent users for dashboard
// @access  Private (Admin/Manager)
router.get('/recent', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const recentUsers = await userController.getRecentUsers(parseInt(limit));
    
    res.json({
      success: true,
      data: recentUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/users/influencer-buyers
// @desc    Get buyers referred by the current influencer's phone number
// @access  Private (Influencer)
router.get('/influencer-buyers', [
  verifyToken,
], async (req, res) => {
  try {
    // Get the current user from the token
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(403).json({
        success: false,
        message: 'No user found in token'
      });
    }
    
    if (currentUser.role !== 'influencer') {
      return res.status(403).json({
        success: false,
        message: `Access denied. User role is '${currentUser.role}', but 'influencer' is required.`
      });
    }

    // Get users referred by this influencer's phone number
    const referredUsers = await userModel.model.find({ 
      referred_by_phone: currentUser.phone,
      role: { $in: ['customer', 'user'] }
    }).select('first_name last_name email phone total_purchases total_liters loyalty_tier createdAt updatedAt status').sort({ createdAt: -1 });

    // For now, use user data without sales aggregation to test basic functionality
    const totalBuyers = referredUsers.length;
    const totalUnits = referredUsers.reduce((sum, user) => sum + (user.total_liters || 0), 0);
    const totalAmount = referredUsers.reduce((sum, user) => sum + (user.total_purchases || 0), 0);
    const totalTransactions = referredUsers.length; // Simplified for now

    // Transform referred users with basic data
    const buyersData = referredUsers.map(user => {
      return {
        id: user._id,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        phone: user.phone,
        email: user.email,
        totalTransactions: user.total_purchases || 0,
        totalAmount: user.total_purchases || 0,
        totalLiters: user.total_liters || 0,
        loyalty_tier: user.loyalty_tier || 'Lead',
        status: user.status || 'active',
        registrationDate: user.createdAt,
        lastTransaction: user.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        influencer: {
          name: `${currentUser.first_name} ${currentUser.last_name || ''}`.trim(),
          phone: currentUser.phone,
          email: currentUser.email
        },
        stats: {
          totalBuyers,
          totalUnits,
          totalAmount,
          totalTransactions
        },
        buyers: buyersData
      }
    });

  } catch (error) {
    console.error('Influencer buyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching influencer buyers data'
    });
  }
});

// @route   GET /api/users/influencer-by-phone/:phone
// @desc    Get influencer by phone number
// @access  Private (User)
router.get('/influencer-by-phone/:phone', verifyToken, async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Find influencer by phone number
    const influencer = await userModel.findOne({ 
      phone: phone,
      role: 'influencer'
    });

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found with this phone number'
      });
    }

    // Count referred users
    const referredUsersCount = await userModel.model.countDocuments({
      referred_by_phone: phone
    });

    // Calculate total liters consumed by all referred users
    const referredUsers = await userModel.model.find({
      referred_by_phone: phone
    }).select('total_liters');
    
    const totalLitersConsumed = referredUsers.reduce((sum, user) => {
      return sum + (user.total_liters || 0);
    }, 0);

    // Prepare response data
    const influencerData = {
      _id: influencer._id,
      first_name: influencer.first_name,
      last_name: influencer.last_name,
      phone: influencer.phone,
      email: influencer.email,
      loyalty_tier: influencer.loyalty_tier,
      total_liters: totalLitersConsumed, // Total from all referred customers
      referred_users_count: referredUsersCount,
      status: influencer.status,
      created_at: influencer.createdAt || influencer.created_at
    };

    res.json({
      success: true,
      data: influencerData
    });
  } catch (error) {
    console.error('Error fetching influencer by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching influencer data'
    });
  }
});

// @route   POST /api/users/register-influencer
// @desc    Register a new influencer
// @access  Public
router.post('/register-influencer', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').isLength({ min: 10, max: 20 }).withMessage('Invalid phone number format')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, influencerPhone } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new influencer user
    const user = await userModel.createUser({
      username: email.split('@')[0], // Use email prefix as username
      email,
      password: password, // Will be hashed by pre-save middleware
      first_name: name,
      phone,
      role: 'influencer',
      status: 'active',
      loyalty_tier: 'lead',
      verification: {
        email_verified: false,
        phone_verified: false
      }
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Influencer registered successfully',
      data: {
        id: user._id,
        name: user.first_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Influencer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   GET /api/users/influencers
// @desc    Get all influencers for dropdown selection
// @access  Public (for registration form)
router.get('/influencers', async (req, res) => {
  try {
    // Get all active influencers with their basic info
    const influencers = await userModel.find({ 
      role: 'influencer',
      status: 'active'
    }).select('first_name last_name phone email').sort({ first_name: 1 });

    // Format the response for dropdown usage
    const formattedInfluencers = influencers.map(influencer => ({
      id: influencer._id,
      name: `${influencer.first_name} ${influencer.last_name || ''}`.trim(),
      phone: influencer.phone,
      email: influencer.email
    }));

    res.json({
      success: true,
      data: formattedInfluencers
    });

  } catch (error) {
    console.error('Error fetching influencers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching influencers'
    });
  }
});

// @route   GET /api/users/customer-by-phone/:phone
// @desc    Get customer by phone number for invoice creation
// @access  Public (for billing integration)
router.get('/customer-by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Find customer by phone number
    const customer = await userModel.findOne({ 
      phone: phone,
      role: { $in: ['customer', 'user'] },
      status: 'active'
    }).select('first_name last_name email phone');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found with this phone number'
      });
    }

    // Format the response
    const customerData = {
      id: customer._id,
      name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      email: customer.email,
      phone: customer.phone
    };

    res.json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching customer data'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Manager)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userController.getUserById(id);
    
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


// @route   POST /api/users/register-customer
// @desc    Register a new customer
// @access  Public
router.post('/register-customer', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').isLength({ min: 10, max: 20 }).withMessage('Invalid phone number format'),
  body('influencerPhone').optional({ nullable: true, checkFalsy: true }).isLength({ min: 10, max: 20 }).withMessage('Invalid influencer phone number format')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, influencerPhone } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if phone already exists
    const existingPhone = await userModel.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // If influencer phone is provided, validate it exists in database
    if (influencerPhone) {
      const influencer = await userModel.findOne({ 
        phone: influencerPhone, 
        role: 'influencer' 
      });
      if (!influencer) {
        return res.status(400).json({
          success: false,
          message: 'The influencer phone number does not exist in our system. Please verify the number or leave it blank if you were not referred by an influencer.'
        });
      }
    }

    // Create new customer user
    const userData = {
      username: email.split('@')[0], // Use email prefix as username
      email,
      password_hash: password, // Will be hashed by pre-save middleware
      first_name: name,
      phone,
      role: 'customer',
      status: 'active',
      loyalty_tier: 'lead',
      referred_by_phone: influencerPhone || undefined,
      verification: {
        email_verified: false,
        phone_verified: false
      }
    };

    const user = await userModel.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   GET /api/users/influencer-dashboard/:influencerId
// @desc    Get influencer dashboard data
// @access  Private (Influencer)
router.get('/influencer-dashboard/:influencerId', [
  verifyToken,
  // Allow influencers to access their own data
], async (req, res) => {
  try {
    const { influencerId } = req.params;
    
    // Get influencer data
    const influencer = await userModel.findById(influencerId);
    if (!influencer || influencer.role !== 'influencer') {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    // Get users referred by this influencer's phone number
    const referredUsers = await userModel.find({ 
      referred_by_phone: influencer.phone,
      role: { $in: ['customer', 'user'] }
    }).select('first_name last_name email phone total_purchases total_liters createdAt updatedAt').sort({ createdAt: -1 });

    // Calculate totals
    const totalReferrals = referredUsers.length;
    const totalUnitsPurchased = referredUsers.reduce((sum, user) => sum + (user.total_liters || 0), 0);
    const totalPurchases = referredUsers.reduce((sum, user) => sum + (user.total_purchases || 0), 0);

    // Get real commission data from sales for this influencer
    const Sale = require('../models/Sale');
    const saleModel = new Sale();
    
    // Get all sales from referred users
    const referredUserIds = referredUsers.map(user => user._id);
    const salesData = await saleModel.model.aggregate([
      {
        $match: {
          user_id: { $in: referredUserIds },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commission.amount' },
          totalSales: { $sum: '$total_amount' },
          totalLiters: { $sum: '$total_liters' },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    const commissionData = salesData[0] || { totalCommission: 0, totalSales: 0, totalLiters: 0, salesCount: 0 };
    
    // Calculate real rewards and earnings
    const currentRewards = commissionData.totalCommission || 0;
    const totalEarnings = commissionData.totalCommission || 0;

    res.json({
      success: true,
      data: {
        influencer: {
          name: influencer.first_name,
          email: influencer.email,
          phone: influencer.phone
        },
        stats: {
          totalReferrals,
          totalUnitsPurchased,
          currentRewards,
          totalEarnings
        },
        referredUsers: referredUsers.map(user => ({
          id: user._id,
          name: `${user.first_name} ${user.last_name || ''}`.trim(),
          email: user.email,
          phone: user.phone,
          totalPurchases: user.total_purchases || 0,
          totalLiters: user.total_liters || 0,
          registrationDate: user.createdAt,
          lastUpdate: user.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Influencer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin) - Temporarily disabled for testing
router.post('/', [
  verifyToken,  // Re-enabled authentication
  requireAdmin,  // Re-enabled authorization
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format. Please enter a valid email address (e.g., user@example.com)'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('last_name').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Invalid phone number format. Please enter a valid phone number (10-15 digits)'),
  body('role').isIn(['admin', 'manager', 'staff', 'influencer', 'customer', 'seller']).withMessage('Invalid user type. Please select Customer, Influencer, or Seller'),
  body('loyalty_tier').optional().isIn(['lead', 'silver', 'gold', 'platinum']).withMessage('Invalid loyalty tier'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Create user-friendly error messages
      const errorMessages = errors.array().map(error => {
        switch (error.path) {
          case 'username':
            if (error.msg.includes('length')) {
              return 'Username must be between 3 and 50 characters';
            }
            return 'Invalid username format';
          case 'email':
            return 'Invalid email format. Please enter a valid email address (e.g., user@example.com)';
          case 'password':
            return 'Password must be at least 6 characters long';
          case 'first_name':
            return 'First name must be at least 2 characters long';
          case 'last_name':
            return 'Last name must be at least 2 characters long';
          case 'phone':
            return 'Invalid phone number format. Please enter a valid phone number (10-15 digits)';
          case 'role':
            return 'Invalid user type. Please select Customer or Influencer';
          case 'loyalty_tier':
            return 'Invalid loyalty tier. Please select Lead, Silver, Gold, or Platinum';
          case 'status':
            return 'Invalid status. Please select Active, Inactive, or Suspended';
          default:
            return error.msg;
        }
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: errorMessages[0], // Show the first error message
        details: errors.array()
      });
    }

    const newUser = await userController.createUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: newUser }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin/Manager) - Temporarily disabled for testing
router.put('/:id', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('first_name').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Please enter a valid phone number'),
  body('role').optional().isIn(['admin', 'manager', 'staff', 'influencer', 'customer']).withMessage('Invalid role'),
  body('loyalty_tier').optional().isIn(['lead', 'silver', 'gold', 'platinum']).withMessage('Invalid loyalty tier'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await userController.updateUser(id, req.body);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin) - Temporarily disabled for testing
router.delete('/:id', [
  verifyToken,  // Re-enabled authentication
  requireAdmin,  // Re-enabled authorization
], async (req, res) => {
  try {
    const { id } = req.params;
    await userController.deleteUser(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (Admin/Manager)
router.get('/stats/overview', [verifyToken, requireManager], async (req, res) => {
  try {
    const userStats = await userController.getUserStats();
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics for dashboard cards
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/stats', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    const userStats = await userController.getUserStats();
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/users/:id/reset-password
// @desc    Admin reset user password
// @access  Private (Admin)
router.post('/:id/reset-password', [
  verifyToken,
  requireAdmin,
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    
    const result = await userController.resetUserPassword(id, newPassword);
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/users/test-influencer-data
// @desc    Test endpoint to get all influencers and their referral data
// @access  Public (for testing)
router.get('/test-influencer-data', [
  // No authentication required for testing
], async (req, res) => {
  try {
    // Get all influencers
    const influencers = await userModel.find({ role: 'influencer' }).select('first_name email phone createdAt');
    
    // Get all users with referral data
    const usersWithReferrals = await userModel.find({ 
      referred_by_phone: { $exists: true, $ne: null }
    }).select('first_name last_name email phone referred_by_phone total_purchases total_liters createdAt updatedAt');

    res.json({
      success: true,
      data: {
        influencers,
        usersWithReferrals,
        totalInfluencers: influencers.length,
        totalUsersWithReferrals: usersWithReferrals.length
      }
    });

  } catch (error) {
    console.error('Test influencer data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching test data'
    });
  }
});

// NOTE: /my-level-progress endpoint has been moved to /api/auth/my-level-progress
// This is because customers need access to their own level data, and /users routes
// are restricted to admin/manager roles. See backend/routes/auth.js for the implementation.

module.exports = router; 