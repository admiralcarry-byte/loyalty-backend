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
    lastSyncStatus: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      default: 'success'
    },
    lastSyncError: String
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
  commissionGenerated: {
    type: Number,
    default: 0
  },
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
      $gte: options.startDate,
      $lte: options.endDate
    };
  }
  
  return this.find(query)
    .populate('storeId', 'name address city state')
    .sort({ date: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

billingCompanyInvoiceSchema.statics.findByInvoiceId = function(invoiceId) {
  return this.findOne({ invoiceId })
    .populate('userId', 'first_name last_name email')
    .populate('storeId', 'name address city state');
};

billingCompanyInvoiceSchema.statics.findUnreconciled = function() {
  return this.find({
    'reconciliationData.matchedPurchaseEntry': { $exists: false },
    'reconciliationData.matchedOnlinePurchase': { $exists: false },
    status: 'completed'
  })
    .populate('userId', 'first_name last_name email')
    .populate('storeId', 'name address')
    .sort({ date: -1 });
};

billingCompanyInvoiceSchema.statics.getStatistics = function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
          }
        },
        refundedAmount: {
          $sum: {
            $cond: [{ $in: ['$status', ['refunded', 'partially_refunded']] }, '$amount', 0]
          }
        },
        totalPointsAwarded: { $sum: '$pointsAwarded' },
        totalCashbackAwarded: { $sum: '$cashbackAwarded' },
        totalCommissionGenerated: { $sum: '$commissionGenerated' }
      }
    }
  ]);
};

billingCompanyInvoiceSchema.statics.getPaymentMethodStats = function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
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
    confidence
  };
  return this.save();
};

billingCompanyInvoiceSchema.methods.awardPointsAndCashback = function(points, cashback, commission = 0) {
  this.pointsAwarded = points;
  this.cashbackAwarded = cashback;
  this.commissionGenerated = commission;
  return this.save();
};

billingCompanyInvoiceSchema.methods.updateSyncStatus = function(status, error = null) {
  this.externalData.lastSyncStatus = status;
  if (error) {
    this.externalData.lastSyncError = error;
  }
  this.syncedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('BillingCompanyInvoice', billingCompanyInvoiceSchema, 'billingcompanyinvoice');