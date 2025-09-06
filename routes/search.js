const express = require('express');
const { query, validationResult } = require('express-validator');
const { 
  User, 
  Product, 
  Store, 
  Sale, 
  Campaign,
  Notification
} = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search
// @desc    Global search across multiple entities
// @access  Private (Manager+)
router.get('/', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['users', 'products', 'stores', 'sales', 'campaigns', 'all']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
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

    const { q: searchQuery, type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const results = {
      users: [],
      products: [],
      stores: [],
      sales: [],
      campaigns: [],
      total_results: 0
    };

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await User.searchUsers(searchQuery, parseInt(limit), offset);
      results.users = users;
    }

    // Search products
    if (type === 'all' || type === 'products') {
      const products = await Product.searchProducts(searchQuery, parseInt(limit), offset);
      results.products = products;
    }

    // Search stores
    if (type === 'all' || type === 'stores') {
      const stores = await Store.searchStores(searchQuery, parseInt(limit), offset);
      results.stores = stores;
    }

    // Search sales
    if (type === 'all' || type === 'sales') {
      const sales = await Sale.searchSales(searchQuery, parseInt(limit), offset);
      results.sales = sales;
    }

    // Search campaigns
    if (type === 'all' || type === 'campaigns') {
      const campaigns = await Campaign.searchCampaigns(searchQuery, parseInt(limit), offset);
      results.campaigns = campaigns;
    }

    // Calculate total results
    results.total_results = results.users.length + results.products.length + 
                           results.stores.length + results.sales.length + results.campaigns.length;

    res.json({
      success: true,
      data: {
        query: searchQuery,
        type,
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: results.total_results
        }
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    });
  }
});

// @route   GET /api/search/users
// @desc    Search users specifically
// @access  Private (Manager+)
router.get('/users', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('role').optional().isIn(['customer', 'influencer', 'admin', 'manager', 'staff']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('loyalty_tier').optional().isIn(['lead', 'silver', 'gold', 'platinum']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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

    const { 
      q: searchQuery, 
      role, 
      status, 
      loyalty_tier, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Search users using User model
    const users = await User.searchUsers(searchQuery, parseInt(limit), offset, {
      role,
      status,
      loyalty_tier
    });

    // Get total count for pagination
    const searchRegex = { $regex: searchQuery, $options: 'i' };
    const total = await User.count({
      $or: [
        { username: searchRegex },
        { email: searchRegex },
        { first_name: searchRegex },
        { last_name: searchRegex },
        { phone: searchRegex }
      ]
    });

    res.json({
      success: true,
      data: {
        query: searchQuery,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// @route   GET /api/search/products
// @desc    Search products specifically
// @access  Private (Manager+)
router.get('/products', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('category').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'discontinued']),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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

    const { 
      q: searchQuery, 
      category, 
      status, 
      min_price, 
      max_price, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Search products using Product model
    const products = await Product.searchProducts(searchQuery, parseInt(limit), offset, {
      category,
      status,
      min_price,
      max_price
    });

    // Get total count for pagination
    const searchRegex = { $regex: searchQuery, $options: 'i' };
    const total = await Product.count({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { category: searchRegex }
      ]
    });

    res.json({
      success: true,
      data: {
        query: searchQuery,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

// @route   GET /api/search/stores
// @desc    Search stores specifically
// @access  Private (Manager+)
router.get('/stores', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('city').optional().isString(),
  query('state').optional().isString(),
  query('status').optional().isIn(['active', 'inactive']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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

    const { 
      q: searchQuery, 
      city, 
      state, 
      status, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Search stores using Store model
    const stores = await Store.searchStores(searchQuery, parseInt(limit), offset, {
      city,
      state,
      status
    });

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM stores WHERE 
      (name LIKE ? OR address LIKE ? OR city LIKE ? OR state LIKE ? OR phone LIKE ?)`;
    const searchTerm = `%${searchQuery}%`;
    const countResult = await Store.executeQuery(countQuery, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        query: searchQuery,
        stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Store search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search stores'
    });
  }
});

// @route   GET /api/search/sales
// @desc    Search sales specifically
// @access  Private (Manager+)
router.get('/sales', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('status').optional().isIn(['pending', 'completed', 'cancelled']),
  query('payment_method').optional().isString(),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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

    const { 
      q: searchQuery, 
      status, 
      payment_method, 
      start_date, 
      end_date, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Search sales using Sale model
    const sales = await Sale.searchSales(searchQuery, parseInt(limit), offset, {
      status,
      payment_method,
      start_date,
      end_date
    });

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      LEFT JOIN stores st ON s.store_id = st.id 
      WHERE (s.transaction_id LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR st.name LIKE ?)`;
    const searchTerm = `%${searchQuery}%`;
    const countResult = await Sale.executeQuery(countQuery, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        query: searchQuery,
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Sales search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search sales'
    });
  }
});

// @route   GET /api/search/campaigns
// @desc    Search campaigns specifically
// @access  Private (Manager+)
router.get('/campaigns', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'expired']),
  query('target_tier').optional().isIn(['lead', 'silver', 'gold', 'platinum']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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

    const { 
      q: searchQuery, 
      type, 
      status, 
      target_tier, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Search campaigns using Campaign model
    const campaigns = await Campaign.searchCampaigns(searchQuery, parseInt(limit), offset, {
      type,
      status,
      target_tier
    });

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM campaigns WHERE 
      (name LIKE ? OR description LIKE ? OR type LIKE ?)`;
    const searchTerm = `%${searchQuery}%`;
    const countResult = await Campaign.executeQuery(countQuery, [searchTerm, searchTerm, searchTerm]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        query: searchQuery,
        campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Campaign search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search campaigns'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Private (Manager+)
router.get('/suggestions', [
  verifyToken,
  requireManager,
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['users', 'products', 'stores', 'sales', 'campaigns', 'all'])
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

    const { q: searchQuery, type = 'all' } = req.query;

    const suggestions = {
      users: [],
      products: [],
      stores: [],
      sales: [],
      campaigns: []
    };

    // Get suggestions for each type
    if (type === 'all' || type === 'users') {
      const userSuggestions = await User.executeQuery(
        `SELECT DISTINCT username, first_name, last_name, email FROM users 
         WHERE username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? 
         LIMIT 5`,
        [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
      );
      suggestions.users = userSuggestions;
    }

    if (type === 'all' || type === 'products') {
      const productSuggestions = await Product.executeQuery(
        `SELECT DISTINCT name, sku, category FROM products 
         WHERE name LIKE ? OR sku LIKE ? OR category LIKE ? 
         LIMIT 5`,
        [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
      );
      suggestions.products = productSuggestions;
    }

    if (type === 'all' || type === 'stores') {
      const storeSuggestions = await Store.executeQuery(
        `SELECT DISTINCT name, city, state FROM stores 
         WHERE name LIKE ? OR city LIKE ? OR state LIKE ? 
         LIMIT 5`,
        [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
      );
      suggestions.stores = storeSuggestions;
    }

    res.json({
      success: true,
      data: {
        query: searchQuery,
        type,
        suggestions
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search suggestions'
    });
  }
});

module.exports = router;