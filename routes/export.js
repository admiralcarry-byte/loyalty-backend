const express = require('express');
const { query, validationResult } = require('express-validator');
const { 
  User, 
  Sale, 
  Product, 
  Store, 
  PointsTransaction, 
  CashbackTransaction,
  Commission,
  Campaign,
  Notification
} = require('../models');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/export/users
// @desc    Export users data to CSV
// @access  Private (Manager/Admin)
router.get('/users', [
  verifyToken, 
  requireManager,
  query('format').optional().isIn(['csv', 'json']),
  query('role').optional().isIn(['customer', 'influencer', 'admin', 'manager', 'staff']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('loyalty_tier').optional().isIn(['lead', 'silver', 'gold', 'platinum'])
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

    const { format = 'csv', role, status, loyalty_tier } = req.query;

    // Build MongoDB query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (loyalty_tier) query.loyalty_tier = loyalty_tier;

    // Get users using User model with filters
    const users = await User.find(query)
      .select('first_name last_name email phone role status loyalty_tier points_balance liter_balance total_purchases total_liters created_at updated_at')
      .sort({ created_at: -1 });

    if (format === 'csv') {
      const csvHeaders = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Status', 
        'Loyalty Tier', 'Points Balance', 'Liter Balance', 'Total Purchases', 
        'Total Liters', 'Created At', 'Updated At'
      ];
      
      const csvData = users.map(user => [
        user.id, 
        user.first_name || '', 
        user.last_name || '', 
        user.email || '', 
        user.phone || '', 
        user.role || '', 
        user.status || '', 
        user.loyalty_tier || '', 
        user.points_balance || 0, 
        user.liter_balance || 0,
        user.total_purchases || 0,
        user.total_liters || 0,
        user.created_at || '', 
        user.updated_at || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      res.json({ 
        success: true, 
        data: users, 
        total: users.length,
        filters: { role, status, loyalty_tier }
      });
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export users data' 
    });
  }
});

// @route   GET /api/export/sales
// @desc    Export sales data to CSV
// @access  Private (Manager/Admin)
router.get('/sales', [
  verifyToken, 
  requireManager,
  query('format').optional().isIn(['csv', 'json']),
  query('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']),
  query('payment_method').optional().isString(),
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

    const { format = 'csv', status, payment_method, start_date, end_date } = req.query;

    // Build MongoDB query
    const query = {};
    if (status) query.status = status;
    if (payment_method) query.payment_method = payment_method;
    if (start_date) query.created_at = { $gte: new Date(start_date) };
    if (end_date) query.created_at = { ...query.created_at, $lte: new Date(end_date) };

    // Get sales using Sale model with filters
    const sales = await Sale.find(query)
      .populate('user', 'first_name last_name email')
      .select('transaction_id total_amount quantity unit_price points_earned payment_method payment_status created_at')
      .sort({ created_at: -1 });

    if (format === 'csv') {
      const csvHeaders = [
        'ID', 'Transaction ID', 'Total Amount', 'Quantity', 'Unit Price',
        'Points Earned', 'Payment Method', 'Payment Status', 'Customer Name',
        'Customer Email', 'Store Name', 'Product Name', 'Created At'
      ];
      
      const csvData = sales.map(sale => [
        sale._id, 
        sale.transaction_id || '', 
        sale.total_amount || 0, 
        sale.quantity || 0, 
        sale.unit_price || 0,
        sale.points_earned || 0, 
        sale.payment_method || '', 
        sale.payment_status || '', 
        `${sale.user?.first_name || ''} ${sale.user?.last_name || ''}`.trim(), 
        sale.user?.email || '',
        '', // store_name - would need to populate store if needed
        '', // product_name - would need to populate product if needed
        sale.created_at || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const filename = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      res.json({ 
        success: true, 
        data: sales, 
        total: sales.length,
        filters: { status, payment_method, start_date, end_date }
      });
    }
  } catch (error) {
    console.error('Error exporting sales:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export sales data' 
    });
  }
});

// @route   GET /api/export/products
// @desc    Export products data to CSV
// @access  Private (Manager/Admin)
router.get('/products', [
  verifyToken, 
  requireManager,
  query('format').optional().isIn(['csv', 'json']),
  query('status').optional().isIn(['active', 'inactive', 'discontinued']),
  query('category').optional().isString()
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

    const { format = 'csv', status, category } = req.query;

    // Build MongoDB query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    // Get products using Product model with filters
    const products = await Product.find(query)
      .select('name sku description price points_per_liter stock_quantity category status created_at updated_at')
      .sort({ created_at: -1 });

    if (format === 'csv') {
      const csvHeaders = [
        'ID', 'Name', 'SKU', 'Description', 'Price', 'Points Per Liter',
        'Stock Quantity', 'Category', 'Status', 'Created At', 'Updated At'
      ];
      
      const csvData = products.map(product => [
        product.id, 
        product.name || '', 
        product.sku || '', 
        product.description || '', 
        product.price || 0, 
        product.points_per_liter || 0,
        product.stock_quantity || 0, 
        product.category || '', 
        product.status || '', 
        product.created_at || '', 
        product.updated_at || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      res.json({ 
        success: true, 
        data: products, 
        total: products.length,
        filters: { status, category }
      });
    }
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export products data' 
    });
  }
});

// @route   GET /api/export/points-transactions
// @desc    Export points transactions data to CSV
// @access  Private (Manager/Admin)
router.get('/points-transactions', [
  verifyToken, 
  requireManager,
  query('format').optional().isIn(['csv', 'json']),
  query('type').optional().isIn(['earned', 'spent', 'bonus', 'adjustment']),
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

    const { format = 'csv', type, start_date, end_date } = req.query;

    // Get points transactions using PointsTransaction model with filters
    const transactions = await PointsTransaction.executeQuery(`
      SELECT pt.id, pt.user_id, pt.transaction_type, pt.points_amount,
             pt.balance_before, pt.balance_after, pt.reference_type,
             pt.reference_id, pt.description, pt.created_at,
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             u.email as user_email
      FROM points_transactions pt
      LEFT JOIN users u ON pt.user_id = u.id
      WHERE 1=1
      ${type ? 'AND pt.transaction_type = ?' : ''}
      ${start_date ? 'AND DATE(pt.created_at) >= ?' : ''}
      ${end_date ? 'AND DATE(pt.created_at) <= ?' : ''}
      ORDER BY pt.created_at DESC
    `, [type, start_date, end_date].filter(Boolean));

    if (format === 'csv') {
      const csvHeaders = [
        'ID', 'User ID', 'User Name', 'User Email', 'Transaction Type',
        'Points Amount', 'Balance Before', 'Balance After', 'Reference Type',
        'Reference ID', 'Description', 'Created At'
      ];
      
      const csvData = transactions.map(transaction => [
        transaction.id, 
        transaction.user_id, 
        transaction.user_name || '', 
        transaction.user_email || '', 
        transaction.transaction_type || '',
        transaction.points_amount || 0, 
        transaction.balance_before || 0, 
        transaction.balance_after || 0, 
        transaction.reference_type || '',
        transaction.reference_id || '', 
        transaction.description || '', 
        transaction.created_at || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const filename = `points_transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      res.json({ 
        success: true, 
        data: transactions, 
        total: transactions.length,
        filters: { type, start_date, end_date }
      });
    }
  } catch (error) {
    console.error('Error exporting points transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export points transactions data' 
    });
  }
});

module.exports = router; 