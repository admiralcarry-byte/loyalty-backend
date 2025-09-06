const express = require('express');
const { body, validationResult } = require('express-validator');
const { productController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with pagination and filters
// @access  Private (Manager+)
router.get('/', [verifyToken, requireManager], async (req, res) => {
  try {
    const result = await productController.getAllProducts(req);
    
    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productController.getProductById(id);
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('name').trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('sku').optional().isLength({ min: 3 }).withMessage('SKU must be at least 3 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('category').optional().trim().isLength({ min: 2 }).withMessage('Category must be at least 2 characters'),
  body('status').optional().isIn(['active', 'inactive', 'discontinued', 'out_of_stock']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const newProduct = await productController.createProduct(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: newProduct }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('sku').optional().isLength({ min: 3 }).withMessage('SKU must be at least 3 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('category').optional().trim().isLength({ min: 2 }).withMessage('Category must be at least 2 characters'),
  body('status').optional().isIn(['active', 'inactive', 'discontinued', 'out_of_stock']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await productController.updateProduct(id, req.body);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    await productController.deleteProduct(id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PATCH /api/products/:id/status
// @desc    Update product status
// @access  Private (Manager+)
router.patch('/:id/status', [
  verifyToken,
  requireManager,
  body('status').isIn(['active', 'inactive', 'discontinued', 'out_of_stock']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedProduct = await productController.updateProductStatus(id, status);
    
    res.json({
      success: true,
      message: 'Product status updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock quantity
// @access  Private (Manager+)
router.patch('/:id/stock', [
  verifyToken,
  requireManager,
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const updatedProduct = await productController.updateStockQuantity(id, quantity);
    
    res.json({
      success: true,
      message: 'Product stock updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/products/stats/overview
// @desc    Get product statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [verifyToken, requireManager], async (req, res) => {
  try {
    const productStats = await productController.getProductStats();
    
    res.json({
      success: true,
      data: productStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/products/search/:term
// @desc    Search products
// @access  Private (Manager+)
router.get('/search/:term', [verifyToken, requireManager], async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;
    const products = await productController.searchProducts(term, parseInt(limit));
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Private (Manager+)
router.get('/category/:category', [verifyToken, requireManager], async (req, res) => {
  try {
    const { category } = req.params;
    const products = await productController.getProductsByCategory(category);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/products/low-stock
// @desc    Get low stock products
// @access  Private (Manager+)
router.get('/low-stock', [verifyToken, requireManager], async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const products = await productController.getLowStockProducts(parseInt(threshold));
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 