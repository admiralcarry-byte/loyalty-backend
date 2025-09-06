const express = require('express');
const router = express.Router();
const BankDetails = require('../models/BankDetails');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get all bank details with pagination and filters
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      bankFilter = 'all',
      statusFilter = 'all'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      bankFilter,
      statusFilter
    };

    const result = await BankDetails.getAllBankDetails(options);
    
    res.json({
      success: true,
      data: result.bankDetails,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details',
      error: error.message
    });
  }
});

// Get bank details statistics
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await BankDetails.getVerificationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching bank details stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details statistics',
      error: error.message
    });
  }
});

// Get bank details by ID
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const bankDetails = await BankDetails.findById(req.params.id);
    
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found'
      });
    }

    res.json({
      success: true,
      data: bankDetails
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details',
      error: error.message
    });
  }
});

// Create new bank details
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const bankDetails = await BankDetails.createBankDetails(req.body);
    
    res.status(201).json({
      success: true,
      data: bankDetails,
      message: 'Bank details created successfully'
    });
  } catch (error) {
    console.error('Error creating bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank details',
      error: error.message
    });
  }
});

// Update bank details
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const bankDetails = await BankDetails.updateBankDetails(req.params.id, req.body);
    
    res.json({
      success: true,
      data: bankDetails,
      message: 'Bank details updated successfully'
    });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank details',
      error: error.message
    });
  }
});

// Verify bank details
router.post('/:id/verify', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const verifiedBy = req.user.id;
    
    const bankDetails = await BankDetails.verifyBankDetails(
      req.params.id, 
      verifiedBy, 
      status, 
      rejection_reason
    );
    
    res.json({
      success: true,
      data: bankDetails,
      message: 'Bank details verification updated successfully'
    });
  } catch (error) {
    console.error('Error verifying bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify bank details',
      error: error.message
    });
  }
});

// Deactivate bank details (soft delete)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await BankDetails.deactivateBankDetails(req.params.id);
    
    res.json({
      success: true,
      message: 'Bank details deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate bank details',
      error: error.message
    });
  }
});

module.exports = router;