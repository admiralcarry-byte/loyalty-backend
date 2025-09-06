const userController = require('./userController');
const authController = require('./authController');
const storeController = require('./storeController');
const dashboardController = require('./dashboardController');
const productController = require('./productController');
const saleController = require('./saleController');
const campaignController = require('./campaignController');
const commissionController = require('./commissionController');
const commissionSettingsController = require('./commissionSettingsController');
const commissionRuleController = require('./commissionRuleController');
const payoutRequestController = require('./payoutRequestController');

module.exports = {
  userController,
  authController,
  storeController,
  dashboardController,
  productController,
  saleController,
  campaignController,
  commissionController,
  commissionSettingsController,
  commissionRuleController,
  payoutRequestController
}; 