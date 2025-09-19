const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { 
  Sale, 
  User, 
  Store, 
  Product, 
  CashbackTransaction,
  Commission,
  Notification,
  ScanUpload,
  BillingCompanyInvoice,
  AuditLog
} = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');
const billingCompanyService = require('../services/billingCompanyService');
const fastOCR = require('../utils/fastOCR');
const reconciliationService = require('../services/reconciliationService');
const qrCodeGenerator = require('../utils/qrCodeGenerator');
const qrCodeReader = require('../utils/qrCodeReader');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for high-resolution images
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|tiff|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed (JPG, PNG, PDF, TIFF, BMP, WebP)'));
    }
  }
});

// @route   GET /api/billing/invoices
// @desc    Get all invoices
// @access  Private (Manager+)
router.get('/invoices', [
  verifyToken,
  requireManager,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('user_id').optional().isInt(),
  query('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
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
      page = 1,
      limit = 10,
      user_id,
      status,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;

    // Get sales with details using Sale model
    const sales = await Sale.getSalesWithDetails(
      { user_id, status },
      { limit: parseInt(limit), offset }
    );

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM sales s
      WHERE 1=1
      ${user_id ? 'AND s.user_id = ?' : ''}
      ${status ? 'AND s.status = ?' : ''}
      ${start_date ? 'AND DATE(s.created_at) >= ?' : ''}
      ${end_date ? 'AND DATE(s.created_at) <= ?' : ''}
    `;
    
    const params = [];
    if (user_id) params.push(user_id);
    if (status) params.push(status);
    if (start_date) params.push(start_date);
    if (end_date) params.push(end_date);

    const countResult = await Sale.executeQuery(countQuery, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        invoices: sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invoices'
    });
  }
});

// @route   GET /api/billing/invoices/:id
// @desc    Get invoice by ID
// @access  Private (Manager+)
router.get('/invoices/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Get sale by ID using Sale model
    const saleModel = new Sale();
    const sale = await saleModel.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Get user details
    const userModel = new User();
    const user = await userModel.findById(sale.user_id);
    
    // Get store details
    const storeModel = new Store();
    const store = await storeModel.findById(sale.store_id);
    
    // Get product details
    const productModel = new Product();
    const product = await productModel.findById(sale.product_id);

    res.json({
      success: true,
      data: {
        invoice: {
          ...sale,
          user: user ? {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone
          } : null,
          store: store ? {
            id: store.id,
            name: store.name,
            address: store.address,
            city: store.city,
            state: store.state
          } : null,
          product: product ? {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invoice'
    });
  }
});

// @route   POST /api/billing/invoices/:id/refund
// @desc    Process refund for invoice
// @access  Private (Manager+)
router.post('/invoices/:id/refund', [
  verifyToken,
  requireManager,
  body('refund_amount').isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
  body('reason').isString().withMessage('Refund reason is required'),
  body('refund_method').optional().isIn(['cash', 'card', 'bank_transfer', 'wallet']),
  body('partial_refund').optional().isBoolean()
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
    const { refund_amount, reason, refund_method = 'wallet', partial_refund = false } = req.body;

    // Get sale by ID using Sale model
    const saleModel = new Sale();
    const sale = await saleModel.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if sale is eligible for refund
    if (sale.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded'
      });
    }

    // Check refund amount
    if (refund_amount > sale.total_amount) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed invoice total'
      });
    }

    // Update sale status
    const updateData = {
      status: partial_refund ? 'partially_refunded' : 'refunded',
      notes: `Refund: ${reason} (${refund_method})`
    };

    await Sale.updateById(id, updateData);

    // If refunding to wallet, add cashback
    if (refund_method === 'wallet') {
      const transactionData = {
        user_id: sale.user_id,
        amount: refund_amount,
        type: 'refund',
        status: 'approved',
        reference_type: 'sale',
        reference_id: sale.id,
        description: `Refund for sale #${sale.id}: ${reason}`,
        created_at: new Date()
      };

      const cashbackModel = new CashbackTransaction();
      await cashbackModel.create(transactionData);

      // Create notification
      const notificationModel = new Notification();
      await notificationModel.create({
        title: 'Refund Processed',
        message: `R$ ${refund_amount.toFixed(2)} has been refunded to your wallet for sale #${sale.id}`,
        type: 'success',
        category: 'billing',
        priority: 'normal',
        recipients: [{
          user: sale.user_id,
          delivery_status: 'delivered'
        }],
        created_by: sale.user_id, // Add required created_by field
        created_at: new Date()
      });
    }

    res.json({
      success: true,
      message: `Refund of R$ ${refund_amount.toFixed(2)} processed successfully`,
      data: {
        invoice_id: id,
        refund_amount,
        refund_method,
        partial_refund
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

// @route   GET /api/billing/statistics
// @desc    Get billing statistics
// @access  Private (Manager+)
router.get('/statistics', [
  verifyToken,
  requireManager,
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
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

    const { start_date, end_date } = req.query;

    // Get sales statistics using Sale model
    const salesStats = await Sale.getSalesStats(start_date, end_date);

    // Get payment method statistics
    const paymentStats = await Sale.getPaymentMethodStats(start_date, end_date);

    // Get daily sales
    const dailySales = await Sale.getDailySales(start_date, end_date);

    // Get monthly sales
    const monthlySales = await Sale.getMonthlySales(start_date, end_date);

    res.json({
      success: true,
      data: {
        overview: salesStats,
        payment_methods: paymentStats,
        daily_sales: dailySales,
        monthly_sales: monthlySales,
        filters: {
          start_date,
          end_date
        }
      }
    });
  } catch (error) {
    console.error('Get billing statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get billing statistics'
    });
  }
});

// @route   GET /api/billing/user/:userId
// @desc    Get user billing history
// @access  Private (Manager+)
router.get('/user/:userId', [
  verifyToken,
  requireManager,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
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

    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      start_date, 
      end_date 
    } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const offset = (page - 1) * limit;

    // Get user's sales using Sale model with filters
    const sales = await Sale.getSalesWithDetails(
      { user_id: userId, status },
      { limit: parseInt(limit), offset }
    );

    // Get user's billing summary
    const billingSummary = await Sale.executeQuery(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount
      FROM sales 
      WHERE user_id = ?
      ${status ? 'AND status = ?' : ''}
      ${start_date ? 'AND DATE(created_at) >= ?' : ''}
      ${end_date ? 'AND DATE(created_at) <= ?' : ''}
    `, [userId, ...(status ? [status] : []), ...(start_date ? [start_date] : []), ...(end_date ? [end_date] : [])]);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone
        },
        invoices: sales,
        summary: billingSummary[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: sales.length
        }
      }
    });
  } catch (error) {
    console.error('Get user billing history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user billing history'
    });
  }
});

// @route   POST /api/billing/create-invoice
// @desc    Create invoice with QR code for new purchase
// @access  Private (Manager+)
router.post('/create-invoice', [
  verifyToken,
  requireManager,
  body('purchaserName').isString().withMessage('Purchaser name is required'),
  body('phoneNumber').optional().isString(),
  body('email').optional().isEmail(),
  body('litersPurchased').isFloat({ min: 0.01 }).withMessage('Liters purchased must be greater than 0'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('storeNumber').optional().isString()
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
      purchaserName, 
      phoneNumber, 
      email, 
      litersPurchased, 
      amount, 
      storeNumber 
    } = req.body;

    // Validate store number if provided
    if (storeNumber) {
      const storeModel = new Store();
      const existingStore = await storeModel.findByCode(storeNumber);
      
      if (!existingStore) {
        return res.status(400).json({
          success: false,
          error: 'No such store exists',
          details: `Store number "${storeNumber}" was not found in the database`
        });
      }
    }

    // Generate QR code data (store number hash)
    const storeNumberHash = Buffer.from(storeNumber || 'default-store').toString('base64');
    
    // Create invoice data with full datetime
    const now = new Date();
    const invoiceData = {
      purchaserName,
      phoneNumber: phoneNumber || '',
      email: email || '',
      litersPurchased: parseFloat(litersPurchased),
      amount: parseFloat(amount),
      storeNumber: storeNumber || '',
      storeNumberHash,
      dateGenerated: now.toISOString(),
      dateGeneratedFormatted: now.toLocaleDateString('en-GB') + ' - ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      qrCodeData: storeNumberHash
    };

    // Store purchase information in database
    // Check if user already exists (by phone or email)
    let userId = null;
    if (phoneNumber || email) {
      const userModel = new User();
      let existingUser = null;
      
      // Try to find by email first
      if (email) {
        existingUser = await userModel.findByEmail(email);
      }
      
      // If not found by email, try to find by phone
      if (!existingUser && phoneNumber) {
        existingUser = await userModel.findOne({ phone: phoneNumber });
      }
      
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    // If user doesn't exist, create a new user record
    if (!userId) {
      const userModel = new User();
      
      // Generate a unique username and password for the customer
      const username = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const password = Math.random().toString(36).substr(2, 8); // Random password
      const password_hash = await bcrypt.hash(password, 10);
      
      const newUser = await userModel.create({
        username: username,
        first_name: purchaserName.split(' ')[0] || purchaserName,
        last_name: purchaserName.split(' ').slice(1).join(' ') || '',
        email: email || `customer_${Date.now()}@example.com`,
        phone: phoneNumber || '',
        password_hash: password_hash,
        role: 'customer',
        status: 'active',
        created_at: new Date()
      });
      userId = newUser.id;
    }

    // Calculate cashback (2% base rate per liter)
    const baseCashbackRate = 2.0; // 2% per liter
    const cashbackEarned = (litersPurchased * baseCashbackRate);

    // Get current commission settings
    const CommissionSettings = require('../models/CommissionSettings');
    const commissionSettingsModel = new CommissionSettings();
    const commissionSettings = await commissionSettingsModel.model.getCurrentSettings();
    
    // Calculate commission based on settings (using lead tier as default for billing)
    const baseCommissionRate = commissionSettings.base_commission_rate || 5.0;
    const commissionAmount = (amount * baseCommissionRate) / 100;

    // Create sale record
    const saleModel = new Sale();
    const saleData = {
      user_id: userId,
      quantity: litersPurchased,
      subtotal: amount,  // Set subtotal to match total_amount for simple invoices
      total_amount: amount,
      currency: 'BRL',
      order_status: 'completed',
      status: 'completed',
      payment_method: 'cash',
      payment_status: 'paid',  // Set payment status to 'paid' for cash transactions
      cashback_earned: cashbackEarned,  // Calculate cashback based on liters purchased
      commission: {
        amount: commissionAmount,  // Calculate commission based on total amount
        rate: baseCommissionRate,  // Commission rate percentage
        calculated: true  // Mark as calculated
      },
      // Invoice-specific fields
      purchaser_name: purchaserName,
      purchaser_phone: phoneNumber || '',
      purchaser_email: email || '',
      liters_purchased: litersPurchased,
      store_number: storeNumber || '',
      store_number_hash: storeNumberHash,
      qr_code_data: storeNumberHash,
      created_at: new Date(),
      notes: `Invoice generated with QR code: ${storeNumberHash}`
    };

    const sale = await saleModel.create(saleData);

    // Generate invoice as image (PNG/JPG) instead of HTML
    const imageResult = await qrCodeGenerator.generateInvoiceImage({
      ...invoiceData,
      invoiceId: sale.id,
      saleId: sale.id
    });

    // Create notification for user
    if (userId) {
      const notificationModel = new Notification();
      await notificationModel.create({
        title: 'Invoice Generated',
        message: `Invoice has been generated for your purchase of ${litersPurchased} liters`,
        type: 'success',
        category: 'billing',
        priority: 'normal',
        recipients: [{
          user: userId,
          delivery_status: 'delivered'
        }],
        created_by: userId, // Add required created_by field
        created_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceId: sale.id,
        ...invoiceData,
        userId,
        saleId: sale.id,
        imageFile: imageResult.success ? {
          filename: imageResult.filename,
          filePath: imageResult.filePath,
          format: imageResult.format,
          width: imageResult.width,
          height: imageResult.height
        } : null,
        qrCode: imageResult.qrCode
      }
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
});

// @route   POST /api/billing/verify-purchase
// @desc    Verify purchase data against database
// @access  Private (Manager+)
router.post('/verify-purchase', [
  verifyToken,
  requireManager,
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').optional().isString(),
  body('litersPurchased').isFloat({ min: 0.01 }).withMessage('Liters purchased must be greater than 0'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('storeNumber').optional().isString()
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
      email, 
      phoneNumber, 
      litersPurchased, 
      amount, 
      storeNumber 
    } = req.body;

    // Search for matching purchase in database
    const saleModel = new Sale();
    const searchCriteria = {
      liters_purchased: parseFloat(litersPurchased),
      total_amount: parseFloat(amount)
    };
    
    console.log('Initial search criteria:', searchCriteria);

    // First try to find sales by amount and liters only
    console.log('Searching by amount and liters only...');
    let matchingSales = await saleModel.findAll(searchCriteria);
    console.log('Sales found by amount and liters:', matchingSales.length);
    
    // If no exact match, try with flexible email matching
    if (matchingSales.length === 0 && email) {
      console.log('No exact match found, trying flexible email search...');
      const emailRegex = new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const flexibleCriteria = {
        ...searchCriteria,
        purchaser_email: { $regex: emailRegex }
      };
      console.log('Flexible search criteria:', flexibleCriteria);
      matchingSales = await saleModel.findAll(flexibleCriteria);
      console.log('Sales found with flexible email:', matchingSales.length);
    }
    
    // If still no match, try with user lookup
    if (matchingSales.length === 0 && email) {
      console.log('Trying user lookup...');
      const userModel = new User();
      const user = await userModel.findOne({ email: email });
      if (user) {
        const userCriteria = {
          ...searchCriteria,
          user_id: user.id
        };
        console.log('User search criteria:', userCriteria);
        matchingSales = await saleModel.findAll(userCriteria);
        console.log('Sales found by user_id:', matchingSales.length);
      }
    }

    // Add phone criteria if still no match
    if (matchingSales.length === 0 && phoneNumber) {
      console.log('Trying phone number search...');
      const userModel = new User();
      const user = await userModel.findOne({ phone: phoneNumber });
      if (user) {
        const phoneCriteria = {
          ...searchCriteria,
          user_id: user.id
        };
        console.log('Phone search criteria:', phoneCriteria);
        matchingSales = await saleModel.findAll(phoneCriteria);
        console.log('Sales found by phone user_id:', matchingSales.length);
      } else {
        const phoneCriteria = {
          ...searchCriteria,
          purchaser_phone: phoneNumber
        };
        console.log('Phone purchaser search criteria:', phoneCriteria);
        matchingSales = await saleModel.findAll(phoneCriteria);
        console.log('Sales found by purchaser_phone:', matchingSales.length);
      }
    }

    const found = matchingSales.length > 0;

    res.json({
      success: true,
      found,
      data: {
        matchingPurchases: matchingSales.length,
        searchCriteria,
        message: found 
          ? `Found ${matchingSales.length} matching purchase(s) in database`
          : 'No matching purchases found in database'
      }
    });
  } catch (error) {
    console.error('Verify purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify purchase data'
    });
  }
});

// @route   GET /api/billing/external-invoices
// @desc    Fetch invoices from billing company API
// @access  Private (Manager+)
router.get('/external-invoices', [
  verifyToken,
  requireManager,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('user_id').optional().isMongoId(),
  query('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
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
      page = 1,
      limit = 50,
      user_id,
      status,
      start_date,
      end_date
    } = req.query;

    // Fetch invoices from billing company API
    const result = await billingCompanyService.fetchInvoices({
      page,
      limit,
      userId: user_id,
      status,
      startDate: start_date,
      endDate: end_date
    }, req.user.id);

    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        error: result.error
      });
    }

    // Get cached invoices from local database
    const cachedInvoices = await BillingCompanyInvoice.findByUser(user_id, {
      status,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      skip: (page - 1) * limit
    });

    res.json({
      success: true,
      data: {
        external_invoices: result.data.invoices || [],
        cached_invoices: cachedInvoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.data.total || cachedInvoices.length
        }
      }
    });
  } catch (error) {
    console.error('Get external invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch external invoices'
    });
  }
});

// @route   GET /api/billing/external-invoices/:invoiceId
// @desc    Fetch specific invoice from billing company API
// @access  Private (Manager+)
router.get('/external-invoices/:invoiceId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Fetch invoice from billing company API
    const result = await billingCompanyService.fetchInvoiceById(invoiceId, req.user.id);

    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        error: result.error
      });
    }

    // Get cached invoice from local database
    const cachedInvoice = await BillingCompanyInvoice.findByInvoiceId(invoiceId);

    res.json({
      success: true,
      data: {
        external_invoice: result.data.invoice,
        cached_invoice: cachedInvoice
      }
    });
  } catch (error) {
    console.error('Get external invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch external invoice'
    });
  }
});

// @route   POST /api/billing/upload-receipt
// @desc    Upload and process receipt using OCR
// @access  Private (Manager+)
router.post('/upload-receipt', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
  upload.single('receipt')
], async (req, res) => {
  try {
    // Debug: Log what we received
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file ? req.file.originalname : 'No file');
    
    // Manual validation after multer processing
    let { userId, storeId, purchaseDate } = req.body;
    
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [{
          type: 'field',
          msg: 'User ID is required',
          path: 'userId',
          location: 'body'
        }]
      });
    }
    
    if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [{
          type: 'field',
          msg: 'Store ID is required',
          path: 'storeId',
          location: 'body'
        }]
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Receipt file is required'
      });
    }

    // We'll determine user and store after QR code analysis
    // For now, just validate that we have the required data
    if (!userId || !storeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data',
        details: 'User ID and Store ID are required for receipt processing'
      });
    }

    // Convert formatted date string back to Date object for database storage
    const parseFormattedDate = (dateString) => {
      if (!dateString) return null;
      if (dateString instanceof Date) return dateString;
      
      // Parse format: "17/09/2025 - 11:08 PM"
      const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}) - (\d{1,2}):(\d{2}) (AM|PM)/);
      if (match) {
        const [, day, month, year, hour, minute, ampm] = match;
        let hour24 = parseInt(hour);
        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (ampm === 'AM' && hour24 === 12) hour24 = 0;
        
        return new Date(year, month - 1, day, hour24, parseInt(minute));
      }
      
      // Fallback to regular Date parsing
      return new Date(dateString);
    };

    // Process receipt with Fast OCR System
    let ocrResult;
    try {
      console.log('Starting Fast OCR processing...');
      ocrResult = await fastOCR.processReceipt(req.file.path);
      console.log(`Fast OCR completed with method: ${ocrResult.extractionMethod}`);
      console.log('Extracted data:', JSON.stringify(ocrResult.parsedData, null, 2));
      console.log('Raw extracted text:', ocrResult.extractedText);
    } catch (ocrError) {
      console.error('Fast OCR processing error:', ocrError);
      return res.status(500).json({
        success: false,
        error: 'OCR processing failed. Please try again with a different image.'
      });
    }

    if (!ocrResult.success) {
      return res.status(400).json({
        success: false,
        error: `OCR processing failed: ${ocrResult.error}`
      });
    }

    // Process QR code extraction
    let qrResult;
    try {
      console.log('Starting QR code processing...');
      qrResult = await qrCodeReader.processReceiptQRCode(req.file.path);
      console.log(`QR code processing completed with method: ${qrResult.extractionMethod}`);
      console.log('QR code data:', JSON.stringify(qrResult.extractedFields, null, 2));
    } catch (qrError) {
      console.error('QR code processing error:', qrError);
      // Don't fail the entire process if QR code extraction fails
      qrResult = {
        success: false,
        error: qrError.message,
        extractedFields: {}
      };
    }

    // Validate extracted data using fast OCR validator
    const validation = fastOCR.validateExtractedData(ocrResult.parsedData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid receipt data extracted',
        details: validation.errors,
        warnings: validation.warnings || [],
        extractedData: ocrResult.parsedData,
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        technique: ocrResult.extractionMethod || 'fast'
      });
    }

    // Find user and store based on QR code data
    const userModel = new User();
    const storeModel = new Store();
    
    let user, store;
    try {
      // Try to find user by QR code data first
      if (qrResult.success && qrResult.extractedFields.customerName) {
        // Try to find user by name (from QR code)
        const customerName = qrResult.extractedFields.customerName;
        const nameParts = customerName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        user = await userModel.model.findOne({
          first_name: firstName,
          last_name: lastName
        });
        
        console.log('User found by QR code name:', user ? 'YES' : 'NO');
        if (user) {
          console.log('User details:', { id: user._id, name: user.first_name + ' ' + user.last_name, email: user.email });
        }
      }
      
      // If not found by QR code, try to find by OCR data
      if (!user && ocrResult.parsedData.customerName) {
        const customerName = ocrResult.parsedData.customerName;
        const nameParts = customerName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        user = await userModel.model.findOne({
          first_name: firstName,
          last_name: lastName
        });
        
        console.log('User found by OCR name:', user ? 'YES' : 'NO');
        if (user) {
          console.log('User details:', { id: user._id, name: user.first_name + ' ' + user.last_name, email: user.email });
        }
      }
      
      // If still not found, try to find by email
      if (!user && ocrResult.parsedData.email) {
        user = await userModel.model.findOne({ email: ocrResult.parsedData.email });
        console.log('User found by email:', user ? 'YES' : 'NO');
        if (user) {
          console.log('User details:', { id: user._id, name: user.first_name + ' ' + user.last_name, email: user.email });
        }
      }
      
      // If still not found, try to find by phone
      if (!user && ocrResult.parsedData.phoneNumber) {
        user = await userModel.model.findOne({ phone: ocrResult.parsedData.phoneNumber });
        console.log('User found by phone:', user ? 'YES' : 'NO');
        if (user) {
          console.log('User details:', { id: user._id, name: user.first_name + ' ' + user.last_name, email: user.email });
        }
      }
      
      // If still not found, use the provided userId as fallback
      if (!user) {
        // Check if userId is a valid ObjectId before querying
        if (userId && userId !== 'placeholder-user-id' && mongoose.Types.ObjectId.isValid(userId)) {
          user = await userModel.findById(userId);
          console.log('User found by provided ID:', user ? 'YES' : 'NO');
          if (user) {
            console.log('User details:', { id: user._id, name: user.first_name + ' ' + user.last_name, email: user.email });
          }
        } else {
          console.log('User ID is placeholder or invalid, skipping database lookup');
        }
      }
      
      // Find store by QR code data first
      if (qrResult.success && qrResult.extractedFields.storeNumber) {
        store = await storeModel.model.findOne({ 'address.postal_code': qrResult.extractedFields.storeNumber });
        console.log('Store found by QR code number:', store ? 'YES' : 'NO');
        if (store) {
          console.log('Store details:', { id: store._id, name: store.name, postal_code: store.address.postal_code });
        }
      }
      
      // If not found by QR code, try to find by OCR data
      if (!store && ocrResult.parsedData.storeName) {
        store = await storeModel.model.findOne({ name: ocrResult.parsedData.storeName });
        console.log('Store found by OCR name:', store ? 'YES' : 'NO');
        if (store) {
          console.log('Store details:', { id: store._id, name: store.name, code: store.code });
        }
      }
      
      // If still not found, use the provided storeId as fallback
      if (!store) {
        // Check if storeId is a valid ObjectId before querying
        if (storeId && storeId !== 'placeholder-store-id' && mongoose.Types.ObjectId.isValid(storeId)) {
          store = await storeModel.findById(storeId);
          console.log('Store found by provided ID:', store ? 'YES' : 'NO');
          if (store) {
            console.log('Store details:', { id: store._id, name: store.name, code: store.code });
          }
        } else {
          console.log('Store ID is placeholder or invalid, skipping database lookup');
        }
      }
      
      // If user still not found, return an error
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
          details: 'Could not find a matching user in the database. Please ensure the customer information is correct or create a new user first.',
          extractedData: {
            customerName: ocrResult.parsedData.customerName,
            email: ocrResult.parsedData.email,
            phoneNumber: ocrResult.parsedData.phoneNumber
          }
        });
      }
      
      // If store still not found, return an error
      if (!store) {
        return res.status(400).json({
          success: false,
          error: 'Store not found',
          details: 'Could not find a matching store in the database. Please ensure the store information is correct or create a new store first.',
          extractedData: {
            storeName: ocrResult.parsedData.storeName,
            storeNumber: qrResult.success ? qrResult.extractedFields.storeNumber : 'Not found in QR code'
          }
        });
      }
      
      // Update userId and storeId with the found values
      userId = user._id.toString();
      storeId = store._id.toString();
      
      console.log('Final User ID:', userId);
      console.log('Final Store ID:', storeId);
      
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database connection error. Please try again.'
      });
    }

    // Create scan upload record
    let scanUpload;
    try {
      scanUpload = await ScanUpload.create({
        userId,
        storeId,
        invoiceNumber: ocrResult.parsedData.invoiceNumber,
        amount: ocrResult.parsedData.amount,
        date: purchaseDate || ocrResult.parsedData.date,
        status: 'provisional',
        filePath: req.file.path,
        ocrExtractedText: ocrResult.extractedText,
        // Store structured OCR data
        ocrData: {
          invoiceNumber: ocrResult.parsedData.invoiceNumber,
          storeName: ocrResult.parsedData.storeName,
          amount: ocrResult.parsedData.amount,
          currency: ocrResult.parsedData.currency,
          date: ocrResult.parsedData.date,
          paymentMethod: ocrResult.parsedData.paymentMethod,
          customerName: ocrResult.parsedData.customerName,
          liters: ocrResult.parsedData.liters,
          phoneNumber: ocrResult.parsedData.phoneNumber,
          email: ocrResult.parsedData.email,
          confidence: ocrResult.confidence,
          extractionMethod: ocrResult.extractionMethod || 'fast'
        },
        // Store structured QR code data
        qrData: qrResult.success ? {
          receiptId: qrResult.extractedFields.receiptId,
          storeNumber: qrResult.extractedFields.storeNumber,
          amount: qrResult.extractedFields.amount,
          date: parseFormattedDate(qrResult.extractedFields.date),
          verificationCode: qrResult.extractedFields.verificationCode,
          customerName: qrResult.extractedFields.customerName,
          transactionId: qrResult.extractedFields.transactionId,
          rawData: qrResult.extractedFields.rawData,
          confidence: qrResult.confidence,
          extractionMethod: qrResult.extractionMethod
        } : {}
      });
    } catch (dbError) {
      console.error('ScanUpload creation error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save receipt data. Please try again.'
      });
    }

    // Log audit trail
    try {
      await AuditLog.create({
        action: 'receipt_upload',
        user: userId, // Use the userId from request body since auth is disabled
        user_role: 'user', // Default role since auth is disabled
        entity_type: 'Sale',
        entity_id: scanUpload._id,
        details: {
          scanUploadId: scanUpload._id,
          fileName: req.file.filename,
          extractedData: ocrResult.parsedData,
          confidence: ocrResult.confidence
        },
        user_ip: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Audit log creation error:', auditError);
      // Don't fail the request for audit log errors, just log them
    }

    // Format the date properly for frontend display
    const formatDateForDisplay = (date) => {
      if (!date) return 'Not Found';
      if (typeof date === 'string') return date;
      if (date instanceof Date) {
        // Format as DD/MM/YYYY - HH:MM AM/PM
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${day}/${month}/${year} - ${displayHours}:${minutes} ${ampm}`;
      }
      return 'Not Found';
    };

    res.json({
      success: true,
      message: 'Receipt uploaded and processed successfully',
      data: {
        scanUploadId: scanUpload._id,
        // OCR extracted data
        ocrData: {
          extractedData: {
            ...ocrResult.parsedData,
            date: formatDateForDisplay(ocrResult.parsedData.date)
          },
          confidence: ocrResult.confidence,
          rawText: ocrResult.extractedText,
          technique: ocrResult.extractionMethod || 'fast',
          extractionMethod: ocrResult.extractionMethod || 'fast',
          processingTime: ocrResult.processingTime
        },
        // QR code extracted data
        qrData: {
          extractedFields: qrResult.extractedFields,
          success: qrResult.success,
          confidence: qrResult.confidence,
          extractionMethod: qrResult.extractionMethod,
          error: qrResult.error
        },
        status: 'provisional',
        warnings: validation.warnings || []
      }
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process receipt upload'
    });
  }
});

// @route   GET /api/billing/ocr-status
// @desc    Get OCR system status and capabilities
// @access  Private (Manager+)
router.get('/ocr-status', async (req, res) => {
  try {
    const status = {
      engines: [{ name: 'fast-ocr', enabled: true, weight: 1.0 }],
      processingModes: ['fast'],
      capabilities: {
        fastOCR: true,
        multiLanguage: true,
        caching: false,
        parallelProcessing: false
      },
      performance: {
        maxWorkers: 1,
        cacheEnabled: false,
        supportedFormats: fastOCR.getSupportedFormats(),
        maxFileSize: fastOCR.getMaxFileSize()
      }
    };
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('OCR status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get OCR system status'
    });
  }
});

// @route   GET /api/billing/scan-uploads
// @desc    Get scan uploads with pagination and filtering
// @access  Private (Manager+)
router.get('/scan-uploads', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('user_id').optional().isMongoId(),
  query('status').optional().isIn(['provisional', 'final', 'rejected']),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
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
      page = 1,
      limit = 20,
      user_id,
      status,
      start_date,
      end_date
    } = req.query;

    const scanUploads = await ScanUpload.findByUser(user_id, {
      status,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      skip: (page - 1) * limit
    });

    res.json({
      success: true,
      data: {
        scanUploads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: scanUploads.length
        }
      }
    });
  } catch (error) {
    console.error('Get scan uploads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scan uploads'
    });
  }
});

// @route   POST /api/billing/scan-uploads/:id/reconcile
// @desc    Reconcile scan upload with existing purchase data
// @access  Private (Manager+)
router.post('/scan-uploads/:id/reconcile', [
  verifyToken,
  requireManager,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('reason').optional().isString(),
  body('purchaseEntryId').optional().isMongoId(),
  body('onlinePurchaseId').optional().isMongoId()
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
    const { action, reason, purchaseEntryId, onlinePurchaseId } = req.body;

    const scanUpload = await ScanUpload.findById(id);
    if (!scanUpload) {
      return res.status(404).json({
        success: false,
        error: 'Scan upload not found'
      });
    }

    if (scanUpload.status !== 'provisional') {
      return res.status(400).json({
        success: false,
        error: 'Only provisional scan uploads can be reconciled'
      });
    }

    if (action === 'approve') {
      // Mark as final and link to purchase data
      await scanUpload.markAsFinal(purchaseEntryId, onlinePurchaseId, 0.9);

      // Award points and cashback (simplified logic)
      const points = Math.floor(scanUpload.amount * 0.1); // 1 point per R$ 10
      const cashback = scanUpload.amount * 0.02; // 2% cashback

      await scanUpload.awardPointsAndCashback(points, cashback);

      // Create points transaction
      await PointsTransaction.create({
        userId: scanUpload.userId,
        points: points,
        type: 'earned',
        source: 'receipt_scan',
        referenceId: scanUpload._id,
        description: `Points earned from receipt scan - Invoice ${scanUpload.invoiceNumber}`
      });

      // Create cashback transaction
      await CashbackTransaction.create({
        userId: scanUpload.userId,
        amount: cashback,
        type: 'earned',
        source: 'receipt_scan',
        referenceId: scanUpload._id,
        description: `Cashback earned from receipt scan - Invoice ${scanUpload.invoiceNumber}`
      });

      // Create notification
      const notificationModel = new Notification();
      await notificationModel.create({
        title: 'Receipt Approved',
        message: `Your receipt for R$ ${scanUpload.amount.toFixed(2)} has been approved. You earned ${points} points and R$ ${cashback.toFixed(2)} cashback.`,
        type: 'success',
        category: 'billing',
        priority: 'normal',
        recipients: [{
          user: scanUpload.userId,
          delivery_status: 'delivered'
        }],
        created_by: scanUpload.userId, // Add required created_by field
        created_at: new Date()
      });

      res.json({
        success: true,
        message: 'Scan upload approved and points/cashback awarded',
        data: {
          scanUploadId: id,
          pointsAwarded: points,
          cashbackAwarded: cashback
        }
      });
    } else {
      // Mark as rejected
      await scanUpload.markAsRejected(reason || 'Rejected by manager', req.user.id);

      res.json({
        success: true,
        message: 'Scan upload rejected',
        data: {
          scanUploadId: id,
          rejectionReason: reason
        }
      });
    }

    // Log audit trail
    await AuditLog.create({
      action: `scan_upload_${action}`,
      user: req.user.id,
      user_role: req.user.role || 'user',
      entity_type: 'Sale',
      entity_id: id,
      details: {
        scanUploadId: id,
        action,
        reason,
        purchaseEntryId,
        onlinePurchaseId
      },
      user_ip: req.ip,
      user_agent: req.get('User-Agent')
    });

  } catch (error) {
    console.error('Reconcile scan upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reconcile scan upload'
    });
  }
});

// @route   GET /api/billing/unified-history/:userId
// @desc    Get unified billing history for a user (joins all collections)
// @access  Private (Manager+)
router.get('/unified-history/:userId', [
  verifyToken,
  requireManager,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate()
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

    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      start_date, 
      end_date 
    } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const offset = (page - 1) * limit;

    // Get unified billing history using aggregation
    const unifiedHistory = await BillingCompanyInvoice.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...(start_date && end_date && {
            date: {
              $gte: start_date,
              $lte: end_date
            }
          })
        }
      },
      {
        $lookup: {
          from: 'scanuploads',
          localField: '_id',
          foreignField: 'reconciliationData.matchedBillingCompanyInvoice',
          as: 'scanUploads'
        }
      },
      {
        $lookup: {
          from: 'pointstransactions',
          localField: '_id',
          foreignField: 'referenceId',
          as: 'pointsTransactions'
        }
      },
      {
        $lookup: {
          from: 'cashbacktransactions',
          localField: '_id',
          foreignField: 'referenceId',
          as: 'cashbackTransactions'
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: '_id',
          as: 'store'
        }
      },
      {
        $addFields: {
          store: { $arrayElemAt: ['$store', 0] },
          totalPoints: { $sum: '$pointsTransactions.points' },
          totalCashback: { $sum: '$cashbackTransactions.amount' }
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $skip: offset
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get summary statistics
    const summary = await BillingCompanyInvoice.getStatistics(start_date, end_date);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone
        },
        unifiedHistory,
        summary: summary[0] || {},
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: unifiedHistory.length
        }
      }
    });
  } catch (error) {
    console.error('Get unified billing history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unified billing history'
    });
  }
});

// @route   POST /api/billing/reconcile
// @desc    Run automatic reconciliation process
// @access  Private (Manager+)
router.post('/reconcile', [verifyToken, requireManager], async (req, res) => {
  try {
    const { type = 'all' } = req.body;

    let result;
    if (type === 'scan_uploads' || type === 'all') {
      result = await reconciliationService.reconcileScanUploads();
    } else if (type === 'billing_invoices' || type === 'all') {
      result = await reconciliationService.reconcileBillingInvoices();
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid reconciliation type. Must be "scan_uploads", "billing_invoices", or "all"'
      });
    }

    // Log audit trail
    await AuditLog.create({
      action: 'reconciliation_run',
      user: req.user.id,
      user_role: req.user.role || 'user',
      entity_type: 'System',
      entity_id: new mongoose.Types.ObjectId(), // Generate new ID for system operations
      details: {
        type,
        result
      },
      user_ip: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Reconciliation completed for ${type}`,
      data: result
    });
  } catch (error) {
    console.error('Reconciliation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run reconciliation'
    });
  }
});

// @route   GET /api/billing/reconciliation-stats
// @desc    Get reconciliation statistics
// @access  Private (Manager+)
router.get('/reconciliation-stats', [verifyToken, requireManager], async (req, res) => {
  try {
    const stats = await reconciliationService.getReconciliationStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get reconciliation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reconciliation statistics'
    });
  }
});

// @route   GET /api/billing/download-invoice/:filename
// @desc    Download invoice image file
// @access  Private
router.get('/download-invoice/:filename', verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    if (!filename || !filename.match(/^invoice-.*\.(png|jpg|jpeg)$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename format'
      });
    }
    
    // Construct file path
    const filePath = path.join(__dirname, '../uploads/qr-codes', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Invoice file not found'
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download invoice file'
    });
  }
});

module.exports = router; 