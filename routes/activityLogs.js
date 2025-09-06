const express = require('express');
const router = express.Router();
const activityLogService = require('../services/activityLogService');
const { verifyToken } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  user_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('success', 'warning', 'error', 'info'),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso()
});

const createSchema = Joi.object({
  user_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  action: Joi.string().max(255).required(),
  description: Joi.string().max(1000).allow(''),
  status: Joi.string().valid('success', 'warning', 'error', 'info').default('info'),
  ip_address: Joi.string().max(45).allow(''),
  user_agent: Joi.string().max(1000).allow(''),
  metadata: Joi.object().allow(null)
});

const updateSchema = Joi.object({
  action: Joi.string().max(255),
  description: Joi.string().max(1000).allow(''),
  status: Joi.string().valid('success', 'warning', 'error', 'info'),
  ip_address: Joi.string().max(45).allow(''),
  user_agent: Joi.string().max(1000).allow(''),
  metadata: Joi.object().allow(null)
});

// Get all activity logs with pagination
router.get('/', async (req, res) => {
  try {
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityLogService.getActivityLogs(value);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in activity logs route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get activity logs for a specific user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = querySchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityLogService.getUserActivityLogs(userId, value);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in user activity logs route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get a specific activity log
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await activityLogService.getActivityLogById(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in get activity log route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create a new activity log
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid activity log data',
        details: error.details
      });
    }

    const result = await activityLogService.createActivityLog(value);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in create activity log route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update an activity log
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid activity log data',
        details: error.details
      });
    }

    const result = await activityLogService.updateActivityLog(id, value);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in update activity log route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete an activity log
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await activityLogService.deleteActivityLog(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in delete activity log route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;