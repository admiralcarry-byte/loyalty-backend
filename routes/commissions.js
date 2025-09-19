const express = require('express');
const router = express.Router();
const { verifyToken, requireManager, requireAdmin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const Sale = require('../models/Sale');

// @route   GET /api/commissions/stats/overview
// @desc    Get commission statistics overview
// @access  Private (Manager+)
router.get('/stats/overview', [verifyToken, requireManager], async (req, res) => {
  try {
    const commissionStats = await dashboardController.getCommissionStats();
    res.json({ success: true, data: commissionStats });
  } catch (error) {
    console.error('Commission stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/commissions/user/:userId
// @desc    Get commissions by user
// @access  Private (Manager+)
router.get('/user/:userId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const saleModel = new Sale();
    const commissions = await saleModel.model.aggregate([
      { $match: { user_id: userId, 'commission.amount': { $exists: true, $gt: 0 } } },
      {
        $project: {
          _id: 1,
          user_id: 1,
          store_id: 1,
          total_amount: 1,
          commission: 1,
          status: 1,
          created_at: 1,
          createdAt: 1
        }
      },
      { $sort: { created_at: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, data: commissions });
  } catch (error) {
    console.error('User commissions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/commissions/store/:storeId
// @desc    Get commissions by store
// @access  Private (Manager+)
router.get('/store/:storeId', [verifyToken, requireManager], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const saleModel = new Sale();
    const commissions = await saleModel.model.aggregate([
      { $match: { store_id: storeId, 'commission.amount': { $exists: true, $gt: 0 } } },
      {
        $project: {
          _id: 1,
          user_id: 1,
          store_id: 1,
          total_amount: 1,
          commission: 1,
          status: 1,
          created_at: 1,
          createdAt: 1
        }
      },
      { $sort: { created_at: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, data: commissions });
  } catch (error) {
    console.error('Store commissions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/commissions
// @desc    Get all commissions with pagination
// @access  Private (Admin)
router.get('/', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const { limit = 10, page = 1, status, userId, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match conditions
    const matchConditions = { 'commission.amount': { $exists: true, $gt: 0 } };
    
    if (status) {
      matchConditions.status = status;
    }
    if (userId) {
      matchConditions.user_id = userId;
    }
    if (storeId) {
      matchConditions.store_id = storeId;
    }

    const saleModel = new Sale();
    const commissions = await saleModel.model.aggregate([
      { $match: matchConditions },
      {
        $project: {
          _id: 1,
          user_id: 1,
          store_id: 1,
          total_amount: 1,
          commission: 1,
          status: 1,
          created_at: 1,
          createdAt: 1
        }
      },
      { $sort: { created_at: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, data: commissions });
  } catch (error) {
    console.error('All commissions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;