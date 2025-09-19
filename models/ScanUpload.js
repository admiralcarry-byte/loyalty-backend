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
  // OCR extracted data
  ocrData: {
    invoiceNumber: String,
    storeName: String,
    amount: Number,
    currency: String,
    date: Date,
    paymentMethod: String,
    customerName: String,
    liters: Number,
    phoneNumber: String,
    email: String,
    confidence: Number,
    extractionMethod: String
  },
  // QR code extracted data
  qrData: {
    receiptId: String,
    storeNumber: String,
    amount: Number,
    date: Date,
    verificationCode: String,
    customerId: String,
    transactionId: String,
    rawData: String,
    confidence: Number,
    extractionMethod: String
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
      $gte: options.startDate,
      $lte: options.endDate
    };
  }
  
  return this.find(query)
    .populate('storeId', 'name address city state')
    .populate('processedBy', 'first_name last_name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

scanUploadSchema.statics.findPendingReconciliation = function() {
  return this.find({ 
    status: 'provisional',
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
    .populate('userId', 'first_name last_name email')
    .populate('storeId', 'name address')
    .sort({ createdAt: -1 });
};

scanUploadSchema.statics.findByInvoiceNumber = function(invoiceNumber, amount) {
  return this.findOne({
    invoiceNumber,
    amount,
    status: 'provisional'
  });
};

// Instance methods
scanUploadSchema.methods.markAsFinal = function(purchaseEntryId = null, onlinePurchaseId = null, confidence = 1) {
  this.status = 'final';
  this.reconciliationData = {
    matchedPurchaseEntry: purchaseEntryId,
    matchedOnlinePurchase: onlinePurchaseId,
    matchedAt: new Date(),
    confidence
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