const express = require('express');
const router = express.Router();
const tierRequirementController = require('../controllers/tierRequirementController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// @route   GET /api/tier-requirements
// @desc    Get all tier requirements
// @access  Public
router.get('/', tierRequirementController.getAllRequirements);

// @route   GET /api/tier-requirements/liters/:liters
// @desc    Get tier for given liter amount
// @access  Public
router.get('/liters/:liters', tierRequirementController.getTierForLiters);

// @route   PUT /api/tier-requirements
// @desc    Update tier requirements
// @access  Private (Admin only)
router.put('/', verifyToken, requireAdmin, tierRequirementController.updateRequirements);

module.exports = router;