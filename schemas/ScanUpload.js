const mongoose = require('mongoose');

const scanUploadSchema = new mongoose.Schema({
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
  invoiceNumber: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['provisional', 'final', 'rejected'],
    default: 'provisional',
    index: true
  },
  filePath: {
    type: String,
    required: true
  },
  ocrExtractedText: {
    type: String,
    default: ''
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
  rejectionReason: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
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
scanUploadSchema.index({ userId: 1, status: 1 });
scanUploadSchema.index({ storeId: 1, date: 1 });
scanUploadSchema.index({ invoiceNumber: 1, amount: 1 });
scanUploadSchema.index({ createdAt: -1 });

// Static methods
scanUploadSchema.statics.findByUser = function(userId, options = {}) {
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
    .populate('processedBy', 'name email')
    .sort({ createdAt: -1 });
};

scanUploadSchema.statics.findPendingReconciliation = function() {
  return this.find({
    status: 'provisional',
    'reconciliationData.matchedPurchaseEntry': { $exists: false },
    'reconciliationData.matchedOnlinePurchase': { $exists: false }
  })
  .populate('userId', 'name email loyalty_tier')
  .populate('storeId', 'name location')
  .sort({ createdAt: -1 });
};

scanUploadSchema.statics.findByInvoiceNumber = function(invoiceNumber, amount) {
  return this.find({
    invoiceNumber: invoiceNumber,
    amount: amount,
    status: 'provisional'
  })
  .populate('userId', 'name email')
  .populate('storeId', 'name location');
};

// Instance methods
scanUploadSchema.methods.markAsFinal = function(purchaseEntryId = null, onlinePurchaseId = null, confidence = 1) {
  this.status = 'final';
  this.reconciliationData = {
    matchedPurchaseEntry: purchaseEntryId,
    matchedOnlinePurchase: onlinePurchaseId,
    matchedAt: new Date(),
    confidence: confidence
  };
  this.processedAt = new Date();
  return this.save();
};

scanUploadSchema.methods.markAsRejected = function(reason, processedBy) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.processedBy = processedBy;
  this.processedAt = new Date();
  return this.save();
};

scanUploadSchema.methods.awardPointsAndCashback = function(points, cashback) {
  this.pointsAwarded = points;
  this.cashbackAwarded = cashback;
  return this.save();
};

module.exports = mongoose.model('ScanUpload', scanUploadSchema, 'scanuploads');