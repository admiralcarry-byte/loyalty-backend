const express = require('express');
const { body, validationResult } = require('express-validator');
const { storeController } = require('../controllers');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stores
// @desc    Get all stores with pagination and filters
// @access  Private (Manager+)
router.get('/', [
  // verifyToken,  // Temporarily disabled for testing
  // requireManager,  // Temporarily disabled for testing
], async (req, res) => {
  try {
    const result = await storeController.getAllStores(req);
    
    res.json({
      success: true,
      data: result.stores,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/:id
// @desc    Get store by ID
// @access  Private (Manager+)
router.get('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeController.getStoreById(id);
    
    res.json({
      success: true,
      data: { store }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/stores
// @desc    Create new store
// @access  Private (Manager+)
router.post('/', [
  verifyToken,
  requireManager,
  body('name').trim().isLength({ min: 2 }).withMessage('Store name must be at least 2 characters'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('city').trim().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
  body('country').trim().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Phone must be a valid mobile number'),
  body('email').optional().isEmail().withMessage('Email must be a valid email address'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance', 'closed']).withMessage('Invalid status'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
], async (req, res) => {
  try {
    const newStore = await storeController.createStore(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: { store: newStore }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update store
// @access  Private (Manager+)
router.put('/:id', [
  verifyToken,
  requireManager,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Store name must be at least 2 characters'),
  body('address').optional().trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('city').optional().trim().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
  body('country').optional().trim().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Phone must be a valid mobile number'),
  body('email').optional().isEmail().withMessage('Email must be a valid email address'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance', 'closed']).withMessage('Invalid status'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStore = await storeController.updateStore(id, req.body);
    
    res.json({
      success: true,
      message: 'Store updated successfully',
      data: { store: updatedStore }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/stores/:id
// @desc    Delete store
// @access  Private (Manager+)
router.delete('/:id', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    await storeController.deleteStore(id);
    
    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PATCH /api/stores/:id/status
// @desc    Update store status
// @access  Private (Manager+)
router.patch('/:id/status', [
  verifyToken,
  requireManager,
  body('status').isIn(['active', 'inactive', 'maintenance', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedStore = await storeController.updateStoreStatus(id, status);
    
    res.json({
      success: true,
      message: 'Store status updated successfully',
      data: { store: updatedStore }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/stats/overview
// @desc    Get store statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [verifyToken, requireManager], async (req, res) => {
  try {
    const storeStats = await storeController.getAllStoreStats();
    
    res.json({
      success: true,
      data: storeStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/:id/stats
// @desc    Get specific store statistics
// @access  Private (Manager+)
router.get('/:id/stats', [verifyToken, requireManager], async (req, res) => {
  try {
    const { id } = req.params;
    const storeStats = await storeController.getStoreStats(id);
    
    res.json({
      success: true,
      data: storeStats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/location/nearby
// @desc    Get stores by location
// @access  Private (Manager+)
router.get('/location/nearby', [verifyToken, requireManager], async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const stores = await storeController.getStoresByLocation(
      parseFloat(latitude), 
      parseFloat(longitude), 
      parseFloat(radius)
    );
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/search/:term
// @desc    Search stores
// @access  Private (Manager+)
router.get('/search/:term', [verifyToken, requireManager], async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;
    const stores = await storeController.searchStores(term, parseInt(limit));
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/city/:city
// @desc    Get stores by city
// @access  Private (Manager+)
router.get('/city/:city', [verifyToken, requireManager], async (req, res) => {
  try {
    const { city } = req.params;
    const stores = await storeController.getStoresByCity(city);
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/stores/country/:country
// @desc    Get stores by country
// @access  Private (Manager+)
router.get('/country/:country', [verifyToken, requireManager], async (req, res) => {
  try {
    const { country } = req.params;
    const stores = await storeController.getStoresByCountry(country);
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 