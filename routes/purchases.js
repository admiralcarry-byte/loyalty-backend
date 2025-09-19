const express = require('express');
const { body, validationResult } = require('express-validator');
const { PurchaseEntry, User, Store } = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/purchases
// @desc    Get all purchase entries with pagination and filters
// @access  Private (Manager+)
router.get('/', [verifyToken, requireManager], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id = '',
      status = '',
      type = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'purchase_amount', 'status', 'type', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort field'
      });
    }

    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort order'
      });
    }

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('pe.user_id = ?');
      params.push(user_id);
    }

    if (status) {
      whereConditions.push('pe.status = ?');
      params.push(status);
    }

    if (type) {
      whereConditions.push('pe.type = ?');
      params.push(type);
    }

    if (start_date) {
      whereConditions.push('DATE(pe.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(pe.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM purchase_entries pe
      LEFT JOIN users u ON pe.user_id = u.id
      LEFT JOIN stores s ON pe.store_id = s.id
      ${whereClause}
    `;
    const countResult = await PurchaseEntry.executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get purchase entries
    const entriesQuery = `
      SELECT 
        pe.*,
        u.first_name, u.last_name, u.email, u.username,
        s.name as store_name, s.city as store_city
      FROM purchase_entries pe
      LEFT JOIN users u ON pe.user_id = u.id
      LEFT JOIN stores s ON pe.store_id = s.id
      ${whereClause}
      ORDER BY pe.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const entries = await PurchaseEntry.executeQuery(entriesQuery, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get purchase entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get purchase entries'
    });
  }
});

// @route   GET /api/purchases/:id
// @desc    Get purchase entry by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await PurchaseEntry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Purchase entry not found'
      });
    }

    // Get entry with user and store details
    const entryWithDetails = await PurchaseEntry.getEntriesWithUserDetails(1, id);

    res.json({
      success: true,
      data: { entry: entryWithDetails[0] || entry }
    });
  } catch (error) {
    console.error('Get purchase entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get purchase entry'
    });
  }
});

// @route   POST /api/purchases
// @desc    Create new purchase entry
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('user_id').isInt().withMessage('User ID is required'),
  body('purchase_amount').isFloat({ min: 0 }).withMessage('Purchase amount must be greater than or equal to 0'),
  body('liters_purchased').isFloat({ min: 0 }).withMessage('Liters purchased must be greater than or equal to 0'),
  body('type').isIn(['manual', 'receipt_upload']).withMessage('Invalid entry type'),
  body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  body('store_id').optional().isInt().withMessage('Store ID must be an integer'),
  body('purchase_date').optional().isISO8601().toDate().withMessage('Valid purchase date required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('receipt_url').optional().isURL().withMessage('Receipt URL must be a valid URL')
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

    const {
      user_id,
      purchase_amount,
      liters_purchased,
      type,
      status = 'pending',
      store_id,
      purchase_date,
      description,
      receipt_url
    } = req.body;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if store exists if provided
    if (store_id) {
      const store = await Store.findById(store_id);
      if (!store) {
        return res.status(400).json({
          success: false,
          error: 'Store not found'
        });
      }
    }

    // Create purchase entry using PurchaseEntry model
    const entryData = {
      user_id,
      purchase_amount,
      liters_purchased,
      type,
      status,
      store_id,
      purchase_date: purchase_date || new Date(),
      description,
      receipt_url,
      created_at: new Date()
    };

    const newEntry = await PurchaseEntry.create(entryData);

    res.status(201).json({
      success: true,
      message: 'Purchase entry created successfully',
      data: { entry: newEntry }
    });
  } catch (error) {
    console.error('Create purchase entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create purchase entry'
    });
  }
});

// @route   PUT /api/purchases/:id
// @desc    Update purchase entry
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('purchase_amount').optional().isFloat({ min: 0 }).withMessage('Purchase amount must be greater than or equal to 0'),
  body('liters_purchased').optional().isFloat({ min: 0 }).withMessage('Liters purchased must be greater than or equal to 0'),
  body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('receipt_url').optional().isURL().withMessage('Receipt URL must be a valid URL')
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

    const { id } = req.params;
    const updateData = req.body;

    // Check if entry exists
    const existingEntry = await PurchaseEntry.findById(id);
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Purchase entry not found'
      });
    }

    // Update entry using PurchaseEntry model
    updateData.updated_at = new Date();
    await PurchaseEntry.updateById(id, updateData);

    // Get updated entry
    const updatedEntry = await PurchaseEntry.findById(id);

    res.json({
      success: true,
      message: 'Purchase entry updated successfully',
      data: { entry: updatedEntry }
    });
  } catch (error) {
    console.error('Update purchase entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update purchase entry'
    });
  }
});

// @route   DELETE /api/purchases/:id
// @desc    Delete purchase entry
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists
    const existingEntry = await PurchaseEntry.findById(id);
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Purchase entry not found'
      });
    }

    // Delete entry using PurchaseEntry model
    await PurchaseEntry.deleteById(id);

    res.json({
      success: true,
      message: 'Purchase entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete purchase entry'
    });
  }
});

// @route   PUT /api/purchases/:id/approve
// @desc    Approve purchase entry
// @access  Private (Manager+)
router.put('/:id/approve', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists
    const existingEntry = await PurchaseEntry.findById(id);
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Purchase entry not found'
      });
    }

    // Approve entry using PurchaseEntry model
    await PurchaseEntry.approveEntry(id);

    res.json({
      success: true,
      message: 'Purchase entry approved successfully'
    });
  } catch (error) {
    console.error('Approve purchase entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve purchase entry'
    });
  }
});

// @route   PUT /api/purchases/:id/reject
// @desc    Reject purchase entry
// @access  Private (Manager+)
router.put('/:id/reject', [
  verifyToken,
  requireManager,
  body('rejection_reason').optional().isString().withMessage('Rejection reason must be a string')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    // Check if entry exists
    const existingEntry = await PurchaseEntry.findById(id);
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Purchase entry not found'
      });
    }

    // Reject entry using PurchaseEntry model
    await PurchaseEntry.rejectEntry(id, rejection_reason);

    res.json({
      success: true,
      message: 'Purchase entry rejected successfully'
    });
  } catch (error) {
    console.error('Reject purchase entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject purchase entry'
    });
  }
});

// @route   GET /api/purchases/user/:userId
// @desc    Get user's purchase entries
// @access  Private (Manager+)
router.get('/user/:userId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's purchase entries using PurchaseEntry model
    const entries = await PurchaseEntry.findByUser(userId, parseInt(limit));

    // Get user entry history
    const history = await PurchaseEntry.getUserEntryHistory(userId);

    res.json({
      success: true,
      data: {
        entries,
        history,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      }
    });
  } catch (error) {
    console.error('Get user purchase entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user purchase entries'
    });
  }
});

// @route   GET /api/purchases/pending
// @desc    Get pending purchase entries requiring approval
// @access  Private (Manager+)
router.get('/pending', [verifyToken, requireManager], async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get pending entries using PurchaseEntry model
    const pendingEntries = await PurchaseEntry.findPending(parseInt(limit));

    res.json({
      success: true,
      data: { entries: pendingEntries }
    });
  } catch (error) {
    console.error('Get pending purchase entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending purchase entries'
    });
  }
});

// @route   GET /api/purchases/stats/overview
// @desc    Get purchase entries statistics overview
// @access  Private (Manager+) - Temporarily disabled for testing
router.get('/stats/overview', [
  verifyToken,  // Re-enabled authentication
  requireManager,  // Re-enabled authorization
], async (req, res) => {
  try {
    // Get purchase entry stats using PurchaseEntry model
    const entryInstance = new PurchaseEntry();
    const entryStats = await entryInstance.getEntryStats();

    res.json({
      success: true,
      data: entryStats
    });
  } catch (error) {
    console.error('Get purchase entry stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get purchase entry statistics'
    });
  }
});

module.exports = router; 