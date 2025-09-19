const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const LoyaltyLevel = require('../schemas/LoyaltyLevel');
const { verifyToken, requireRole } = require('../middleware/auth');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get all loyalty levels
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  query('search').optional().isString().withMessage('Search must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [loyaltyLevels, total] = await Promise.all([
      LoyaltyLevel.find(filter)
        .sort({ level_number: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LoyaltyLevel.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: loyaltyLevels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty levels',
      error: error.message
    });
  }
});

// Get loyalty level by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid loyalty level ID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const loyaltyLevel = await LoyaltyLevel.findById(req.params.id);
    
    if (!loyaltyLevel) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty level not found'
      });
    }

    res.json({
      success: true,
      data: { loyaltyLevel }
    });
  } catch (error) {
    console.error('Error fetching loyalty level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty level',
      error: error.message
    });
  }
});

// Create new loyalty level
router.post('/', [
  verifyToken,
  requireRole(['admin', 'super_admin']),
  body('name').notEmpty().withMessage('Name is required'),
  body('code').optional().isString().withMessage('Code must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('level_number').isInt({ min: 1 }).withMessage('Level number must be a positive integer'),
  body('requirements').isObject().withMessage('Requirements must be an object'),
  body('benefits').isObject().withMessage('Benefits must be an object'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().isString().withMessage('Color must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const loyaltyLevelData = req.body;
    
    // Check if level number already exists
    const existingLevel = await LoyaltyLevel.findOne({ level_number: loyaltyLevelData.level_number });
    if (existingLevel) {
      return res.status(400).json({
        success: false,
        message: 'A loyalty level with this level number already exists'
      });
    }

    // Check if code already exists (if provided)
    if (loyaltyLevelData.code) {
      const existingCode = await LoyaltyLevel.findOne({ code: loyaltyLevelData.code });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A loyalty level with this code already exists'
        });
      }
    }

    const loyaltyLevel = new LoyaltyLevel(loyaltyLevelData);
    await loyaltyLevel.save();

    res.status(201).json({
      success: true,
      data: { loyaltyLevel },
      message: 'Loyalty level created successfully'
    });
  } catch (error) {
    console.error('Error creating loyalty level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loyalty level',
      error: error.message
    });
  }
});

// Update loyalty level
router.put('/:id', [
  verifyToken,
  requireRole(['admin', 'super_admin']),
  param('id').isMongoId().withMessage('Invalid loyalty level ID'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('code').optional().isString().withMessage('Code must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('level_number').optional().isInt({ min: 1 }).withMessage('Level number must be a positive integer'),
  body('requirements').optional().isObject().withMessage('Requirements must be an object'),
  body('benefits').optional().isObject().withMessage('Benefits must be an object'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().isString().withMessage('Color must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const loyaltyLevel = await LoyaltyLevel.findById(req.params.id);
    
    if (!loyaltyLevel) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty level not found'
      });
    }

    // Check if level number already exists (if being updated)
    if (req.body.level_number && req.body.level_number !== loyaltyLevel.level_number) {
      const existingLevel = await LoyaltyLevel.findOne({ 
        level_number: req.body.level_number,
        _id: { $ne: req.params.id }
      });
      if (existingLevel) {
        return res.status(400).json({
          success: false,
          message: 'A loyalty level with this level number already exists'
        });
      }
    }

    // Check if code already exists (if being updated)
    if (req.body.code && req.body.code !== loyaltyLevel.code) {
      const existingCode = await LoyaltyLevel.findOne({ 
        code: req.body.code,
        _id: { $ne: req.params.id }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A loyalty level with this code already exists'
        });
      }
    }

    Object.assign(loyaltyLevel, req.body);
    await loyaltyLevel.save();

    res.json({
      success: true,
      data: { loyaltyLevel },
      message: 'Loyalty level updated successfully'
    });
  } catch (error) {
    console.error('Error updating loyalty level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update loyalty level',
      error: error.message
    });
  }
});

// Delete loyalty level
router.delete('/:id', [
  verifyToken,
  requireRole(['admin', 'super_admin']),
  param('id').isMongoId().withMessage('Invalid loyalty level ID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const loyaltyLevel = await LoyaltyLevel.findById(req.params.id);
    
    if (!loyaltyLevel) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty level not found'
      });
    }

    // Check if any users are assigned to this loyalty level
    const User = require('../schemas/User');
    const usersWithLevel = await User.countDocuments({ loyalty_tier: loyaltyLevel.code });
    if (usersWithLevel > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete loyalty level. ${usersWithLevel} users are currently assigned to this level.`
      });
    }

    await LoyaltyLevel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Loyalty level deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting loyalty level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete loyalty level',
      error: error.message
    });
  }
});

// Get loyalty level statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await LoyaltyLevel.getLoyaltyLevelStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching loyalty level stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty level statistics',
      error: error.message
    });
  }
});

// Get loyalty level by tier
router.get('/tier/:tier', [
  param('tier').isIn(['lead', 'silver', 'gold', 'platinum']).withMessage('Invalid tier'),
  handleValidationErrors
], async (req, res) => {
  try {
    const loyaltyLevel = await LoyaltyLevel.findByTier(req.params.tier);
    
    if (!loyaltyLevel) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty level not found for this tier'
      });
    }

    res.json({
      success: true,
      data: { loyaltyLevel }
    });
  } catch (error) {
    console.error('Error fetching loyalty level by tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty level',
      error: error.message
    });
  }
});

module.exports = router;