const express = require('express');
const { body, validationResult } = require('express-validator');
const Seller = require('../schemas/Seller');
const Sale = require('../models/Sale');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const router = express.Router();

// @route   POST /api/sellers/register
// @desc    Register a new seller
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').isLength({ min: 10, max: 20 }).withMessage('Invalid phone number format'),
  body('storeNumber').trim().isLength({ min: 3 }).withMessage('Store number must be at least 3 characters long')
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

    const { name, email, password, phone, storeNumber } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [{ email }, { store_number: storeNumber.toUpperCase() }]
    });

    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: existingSeller.email === email 
          ? 'Seller with this email already exists' 
          : 'Seller with this store number already exists'
      });
    }

    // Create new seller
    const seller = new Seller({
      name,
      email,
      password_hash: password, // Will be hashed by pre-save middleware
      phone,
      store_number: storeNumber.toUpperCase(),
      verification: {
        email_verified: false,
        phone_verified: false
      }
    });

    await seller.save();

    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      data: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        store_number: seller.store_number,
        status: seller.status
      }
    });

  } catch (error) {
    console.error('Seller registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/sellers/login
// @desc    Login seller
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  body('storeNumber').notEmpty().withMessage('Store number is required')
], async (req, res) => {
  console.log('=== SELLER LOGIN ROUTE HIT ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
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

    const { email, password, storeNumber } = req.body;

    console.log('Login attempt:', { email, storeNumber, passwordLength: password ? password.length : 0 });

    // Find seller by email and store number
    const seller = await Seller.findOne({ 
      email, 
      store_number: storeNumber.toUpperCase() 
    });

    if (!seller) {
      console.log('Seller not found in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if seller is active
    if (seller.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Check password
    console.log('Checking password...');
    const isPasswordValid = await seller.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password validation failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    seller.last_login = new Date();
    await seller.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        sellerId: seller._id, 
        email: seller.email, 
        storeNumber: seller.store_number,
        role: 'seller'
      },
      process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: token,
        seller: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          store_number: seller.store_number,
          status: seller.status,
          total_sales: seller.total_sales,
          total_purchases: seller.total_purchases,
          total_liters: seller.total_liters,
          total_customers: seller.total_customers
        }
      }
    });

  } catch (error) {
    console.error('Seller login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/sellers/dashboard
// @desc    Get seller dashboard data
// @access  Private (Seller)
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const sellerId = req.user._id;
    const storeNumber = req.user.store_number;
    
    if (!sellerId || !storeNumber) {
      return res.status(401).json({
        success: false,
        message: 'Invalid seller credentials'
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Get real data from Sales table for this seller's store
    const saleModel = new Sale();
    
    // Get sales statistics filtered by store number
    const salesStats = await saleModel.getSalesStats({ store_number: storeNumber });
    
    // Get unique customers count for this store
    const uniqueCustomersPipeline = [
      { $match: { store_number: storeNumber, status: 'completed' } },
      { $group: { _id: '$user_id' } },
      { $count: 'totalCustomers' }
    ];
    
    const uniqueCustomersResult = await saleModel.model.aggregate(uniqueCustomersPipeline);
    const totalCustomers = uniqueCustomersResult[0]?.totalCustomers || 0;

    // Get total liters sold for this store
    const totalLitersPipeline = [
      { $match: { store_number: storeNumber, status: 'completed' } },
      { $group: { _id: null, totalLiters: { $sum: '$liters_purchased' } } }
    ];
    
    const totalLitersResult = await saleModel.model.aggregate(totalLitersPipeline);
    const totalLiters = totalLitersResult[0]?.totalLiters || 0;

    // Get total commissions (sum of actual commission amounts)
    const totalCommissionsPipeline = [
      { $match: { store_number: storeNumber, status: 'completed' } },
      { $group: { _id: null, totalCommissions: { $sum: '$commission.amount' } } }
    ];
    
    const totalCommissionsResult = await saleModel.model.aggregate(totalCommissionsPipeline);
    const totalCommissions = totalCommissionsResult[0]?.totalCommissions || 0;

    // Get buyer data for the table
    const buyersPipeline = [
      { $match: { store_number: storeNumber, status: 'completed' } },
      { 
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: { $ifNull: ['$purchaser_name', '$user.first_name'] },
          phone: { $ifNull: ['$purchaser_phone', '$user.phone'] },
          liters: { $ifNull: ['$liters_purchased', 0] },
          amount: '$total_amount',
          commission: { $ifNull: ['$commission.amount', 0] },
          date: '$createdAt'
        }
      },
      { $sort: { date: -1 } },
      { $limit: 10 }
    ];
    
    const buyersResult = await saleModel.model.aggregate(buyersPipeline);
    
    // Get chart data
    const chartDataPipeline = [
      { $match: { store_number: storeNumber, status: 'completed' } },
      {
        $group: {
          _id: null,
          unitsSold: { $sum: '$liters_purchased' },
          totalAmount: { $sum: '$total_amount' },
          totalPurchases: { $sum: 1 },
          numberOfPurchases: { $sum: 1 }
        }
      }
    ];
    
    const chartDataResult = await saleModel.model.aggregate(chartDataPipeline);
    const chartData = chartDataResult[0] || { unitsSold: 0, totalAmount: 0, totalPurchases: 0, numberOfPurchases: 0 };

    res.json({
      success: true,
      data: {
        totalSales: salesStats.total_revenue || 0,
        totalCommissions: totalCommissions,
        totalLiters: totalLiters,
        totalCustomers: totalCustomers,
        pendingOrders: salesStats.pending_sales || 0,
        completedOrders: salesStats.completed_sales || 0,
        seller: {
          name: seller.name,
          store_number: seller.store_number,
          email: seller.email
        },
        growth: {
          revenue_growth: salesStats.revenue_growth_percentage || '0.0',
          liters_growth: salesStats.liters_growth_percentage || '0.0'
        },
        buyers: buyersResult.map(buyer => ({
          name: buyer.name || 'Unknown',
          phone: buyer.phone || 'N/A',
          liters: buyer.liters || 0,
          amount: buyer.amount || 0,
          commission: buyer.commission || 0,
          date: buyer.date ? new Date(buyer.date).toLocaleDateString() : 'N/A'
        })),
        chartData: {
          unitsSold: chartData.unitsSold || 0,
          totalAmount: chartData.totalAmount || 0,
          totalPurchases: chartData.totalPurchases || 0,
          numberOfPurchases: chartData.numberOfPurchases || 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

module.exports = router;