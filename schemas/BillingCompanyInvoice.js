const mongoose = require('mongoose');

const billingCompanyInvoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded', 'partially_refunded'],
    required: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'wallet', 'pix', 'boleto'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  syncedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  externalData: {
    originalInvoiceData: mongoose.Schema.Types.Mixed,
    apiResponse: mongoose.Schema.Types.Mixed,
    syncMetadata: mongoose.Schema.Types.Mixed
  },
  reconciliationData: {
    matchedPurchaseEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseEntry'
    },
    matchedOnlinePurchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlinePurchase'
    },
    matchedScanUpload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScanUpload'
    },
    matchedAt: Date,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  cashbackAwarded: {
    type: Number,
    default: 0
  },
  commissionAwarded: {
    type: Number,
    default: 0
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed', 'retry'],
    default: 'pending'
  },
  syncError: {
    type: String,
    default: ''
  },
  lastSyncAttempt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
billingCompanyInvoiceSchema.index({ userId: 1, status: 1 });
billingCompanyInvoiceSchema.index({ storeId: 1, date: 1 });
billingCompanyInvoiceSchema.index({ syncedAt: -1 });
billingCompanyInvoiceSchema.index({ date: -1, status: 1 });

// Static methods
billingCompanyInvoiceSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.startDate && options.endDate) {
    query.date = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .populate('storeId', 'name location')
    .sort({ date: -1 });
};

billingCompanyInvoiceSchema.statics.findByInvoiceId = function(invoiceId) {
  return this.findOne({ invoiceId })
    .populate('userId', 'name email')
    .populate('storeId', 'name location');
};

billingCompanyInvoiceSchema.statics.findUnreconciled = function() {
  return this.find({
    status: 'completed',
    'reconciliationData.matchedPurchaseEntry': { $exists: false },
    'reconciliationData.matchedOnlinePurchase': { $exists: false },
    'reconciliationData.matchedScanUpload': { $exists: false }
  })
  .populate('userId', 'name email loyalty_tier')
  .populate('storeId', 'name location')
  .sort({ date: -1 });
};

billingCompanyInvoiceSchema.statics.getStatistics = function(startDate, endDate) {
  const matchConditions = {};
  
  if (startDate && endDate) {
    matchConditions.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        pendingInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        totalPointsAwarded: { $sum: '$pointsAwarded' },
        totalCashbackAwarded: { $sum: '$cashbackAwarded' },
        totalCommissionAwarded: { $sum: '$commissionAwarded' }
      }
    }
  ]);
};

billingCompanyInvoiceSchema.statics.getPaymentMethodStats = function(startDate, endDate) {
  const matchConditions = {};
  
  if (startDate && endDate) {
    matchConditions.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Instance methods
billingCompanyInvoiceSchema.methods.markAsReconciled = function(purchaseEntryId = null, onlinePurchaseId = null, scanUploadId = null, confidence = 1) {
  this.reconciliationData = {
    matchedPurchaseEntry: purchaseEntryId,
    matchedOnlinePurchase: onlinePurchaseId,
    matchedScanUpload: scanUploadId,
    matchedAt: new Date(),
    confidence: confidence
  };
  return this.save();
};

billingCompanyInvoiceSchema.methods.awardPointsAndCashback = function(points, cashback, commission = 0) {
  this.pointsAwarded = points;
  this.cashbackAwarded = cashback;
  this.commissionAwarded = commission;
  return this.save();
};

billingCompanyInvoiceSchema.methods.updateSyncStatus = function(status, error = null) {
  this.syncStatus = status;
  this.syncError = error || '';
  this.lastSyncAttempt = new Date();
  return this.save();
};

module.exports = mongoose.model('BillingCompanyInvoice', billingCompanyInvoiceSchema, 'billingcompanyinvoice');