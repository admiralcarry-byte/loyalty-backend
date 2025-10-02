const { 
  ScanUpload, 
  BillingCompanyInvoice, 
  PurchaseEntry, 
  OnlinePurchase,
  PointsTransaction,
  CashbackTransaction,
  Notification,
  AuditLog
} = require('../models');

class ReconciliationService {
  constructor() {
    this.matchThreshold = 0.8; // 80% confidence threshold
    this.amountTolerance = 0.01; // R$ 0.01 tolerance for amount matching
  }

  /**
   * Reconcile scan uploads with existing purchase data
   */
  async reconcileScanUploads() {
    try {
      const pendingUploads = await ScanUpload.findPendingReconciliation();
      const reconciliationResults = [];

      for (const upload of pendingUploads) {
        const result = await this.reconcileSingleScanUpload(upload);
        reconciliationResults.push(result);
      }

      return {
        success: true,
        processed: reconciliationResults.length,
        results: reconciliationResults
      };
    } catch (error) {
      console.error('Reconciliation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reconcile a single scan upload
   */
  async reconcileSingleScanUpload(scanUpload) {
    try {
      // Try to match with purchase entries
      const purchaseEntryMatch = await this.findPurchaseEntryMatch(scanUpload);
      
      // Try to match with online purchases
      const onlinePurchaseMatch = await this.findOnlinePurchaseMatch(scanUpload);
      
      // Try to match with billing company invoices
      const billingInvoiceMatch = await this.findBillingInvoiceMatch(scanUpload);

      const bestMatch = this.selectBestMatch([
        purchaseEntryMatch,
        onlinePurchaseMatch,
        billingInvoiceMatch
      ]);

      if (bestMatch && bestMatch.confidence >= this.matchThreshold) {
        return await this.processMatch(scanUpload, bestMatch);
      } else {
        return {
          scanUploadId: scanUpload._id,
          status: 'no_match',
          confidence: bestMatch?.confidence || 0,
          message: 'No confident match found'
        };
      }
    } catch (error) {
      console.error(`Error reconciling scan upload ${scanUpload._id}:`, error);
      return {
        scanUploadId: scanUpload._id,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Find matching purchase entry
   */
  async findPurchaseEntryMatch(scanUpload) {
    try {
      const matches = await PurchaseEntry.find({
        userId: scanUpload.userId,
        storeId: scanUpload.storeId,
        amount: {
          $gte: scanUpload.amount - this.amountTolerance,
          $lte: scanUpload.amount + this.amountTolerance
        },
        date: {
          $gte: new Date(scanUpload.date.getTime() - 24 * 60 * 60 * 1000), // 1 day before
          $lte: new Date(scanUpload.date.getTime() + 24 * 60 * 60 * 1000)  // 1 day after
        }
      });

      if (matches.length === 0) return null;

      // Find best match based on amount and date proximity
      const bestMatch = matches.reduce((best, current) => {
        const amountDiff = Math.abs(current.amount - scanUpload.amount);
        const dateDiff = Math.abs(current.date.getTime() - scanUpload.date.getTime());
        
        const currentScore = this.calculateMatchScore(amountDiff, dateDiff);
        const bestScore = this.calculateMatchScore(
          Math.abs(best.amount - scanUpload.amount),
          Math.abs(best.date.getTime() - scanUpload.date.getTime())
        );

        return currentScore > bestScore ? current : best;
      });

      const amountDiff = Math.abs(bestMatch.amount - scanUpload.amount);
      const dateDiff = Math.abs(bestMatch.date.getTime() - scanUpload.date.getTime());
      const confidence = this.calculateMatchScore(amountDiff, dateDiff);

      return {
        type: 'purchase_entry',
        record: bestMatch,
        confidence,
        amountDiff,
        dateDiff
      };
    } catch (error) {
      console.error('Error finding purchase entry match:', error);
      return null;
    }
  }

  /**
   * Find matching online purchase
   */
  async findOnlinePurchaseMatch(scanUpload) {
    try {
      const matches = await OnlinePurchase.find({
        userId: scanUpload.userId,
        amount: {
          $gte: scanUpload.amount - this.amountTolerance,
          $lte: scanUpload.amount + this.amountTolerance
        },
        purchaseDate: {
          $gte: new Date(scanUpload.date.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(scanUpload.date.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (matches.length === 0) return null;

      const bestMatch = matches.reduce((best, current) => {
        const amountDiff = Math.abs(current.amount - scanUpload.amount);
        const dateDiff = Math.abs(current.purchaseDate.getTime() - scanUpload.date.getTime());
        
        const currentScore = this.calculateMatchScore(amountDiff, dateDiff);
        const bestScore = this.calculateMatchScore(
          Math.abs(best.amount - scanUpload.amount),
          Math.abs(best.purchaseDate.getTime() - scanUpload.date.getTime())
        );

        return currentScore > bestScore ? current : best;
      });

      const amountDiff = Math.abs(bestMatch.amount - scanUpload.amount);
      const dateDiff = Math.abs(bestMatch.purchaseDate.getTime() - scanUpload.date.getTime());
      const confidence = this.calculateMatchScore(amountDiff, dateDiff);

      return {
        type: 'online_purchase',
        record: bestMatch,
        confidence,
        amountDiff,
        dateDiff
      };
    } catch (error) {
      console.error('Error finding online purchase match:', error);
      return null;
    }
  }

  /**
   * Find matching billing company invoice
   */
  async findBillingInvoiceMatch(scanUpload) {
    try {
      const matches = await BillingCompanyInvoice.find({
        userId: scanUpload.userId,
        storeId: scanUpload.storeId,
        amount: {
          $gte: scanUpload.amount - this.amountTolerance,
          $lte: scanUpload.amount + this.amountTolerance
        },
        date: {
          $gte: new Date(scanUpload.date.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(scanUpload.date.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (matches.length === 0) return null;

      const bestMatch = matches.reduce((best, current) => {
        const amountDiff = Math.abs(current.amount - scanUpload.amount);
        const dateDiff = Math.abs(current.date.getTime() - scanUpload.date.getTime());
        
        const currentScore = this.calculateMatchScore(amountDiff, dateDiff);
        const bestScore = this.calculateMatchScore(
          Math.abs(best.amount - scanUpload.amount),
          Math.abs(best.date.getTime() - scanUpload.date.getTime())
        );

        return currentScore > bestScore ? current : best;
      });

      const amountDiff = Math.abs(bestMatch.amount - scanUpload.amount);
      const dateDiff = Math.abs(bestMatch.date.getTime() - scanUpload.date.getTime());
      const confidence = this.calculateMatchScore(amountDiff, dateDiff);

      return {
        type: 'billing_invoice',
        record: bestMatch,
        confidence,
        amountDiff,
        dateDiff
      };
    } catch (error) {
      console.error('Error finding billing invoice match:', error);
      return null;
    }
  }

  /**
   * Calculate match score based on amount and date differences
   */
  calculateMatchScore(amountDiff, dateDiff) {
    // Amount score (0-1, higher is better)
    const amountScore = Math.max(0, 1 - (amountDiff / 10)); // 10 reais tolerance
    
    // Date score (0-1, higher is better)
    const dateScore = Math.max(0, 1 - (dateDiff / (24 * 60 * 60 * 1000))); // 1 day tolerance
    
    // Weighted combination (amount is more important)
    return (amountScore * 0.7) + (dateScore * 0.3);
  }

  /**
   * Select the best match from multiple candidates
   */
  selectBestMatch(matches) {
    const validMatches = matches.filter(match => match !== null);
    if (validMatches.length === 0) return null;

    return validMatches.reduce((best, current) => {
      return current.confidence > best.confidence ? current : best;
    });
  }

  /**
   * Process a successful match
   */
  async processMatch(scanUpload, match) {
    try {
      // Mark scan upload as final
      await scanUpload.markAsFinal(
        match.type === 'purchase_entry' ? match.record._id : null,
        match.type === 'online_purchase' ? match.record._id : null,
        match.confidence
      );

      // Award points and cashback
      const points = Math.floor(scanUpload.amount * 0.1); // 1 point per R$ 10
      const cashback = scanUpload.amount * 0.02; // 2% cashback

      await scanUpload.awardPointsAndCashback(points, cashback);

      // Create points transaction
      await PointsTransaction.create({
        userId: scanUpload.userId,
        points: points,
        type: 'earned',
        source: 'receipt_scan_reconciled',
        referenceId: scanUpload._id,
        description: `Points earned from reconciled receipt scan - Invoice ${scanUpload.invoiceNumber}`
      });

      // Create cashback transaction
      await CashbackTransaction.create({
        userId: scanUpload.userId,
        amount: cashback,
        type: 'earned',
        source: 'receipt_scan_reconciled',
        referenceId: scanUpload._id,
        description: `Cashback earned from reconciled receipt scan - Invoice ${scanUpload.invoiceNumber}`
      });

      // Create notification
      const notificationModel = new Notification();
      await notificationModel.create({
        title: 'Receipt Automatically Reconciled',
        message: `Your receipt for R$ ${scanUpload.amount.toFixed(2)} has been automatically reconciled. You earned ${points} points and R$ ${cashback.toFixed(2)} cashback.`,
        type: 'success',
        category: 'billing',
        priority: 'normal',
        recipients: [{
          user: scanUpload.userId,
          delivery_status: 'delivered'
        }],
        created_by: scanUpload.userId, // Add required created_by field
        created_at: new Date()
      });

      // Log audit trail
      await AuditLog.create({
        action: 'automatic_reconciliation',
        userId: scanUpload.userId,
        details: {
          scanUploadId: scanUpload._id,
          matchType: match.type,
          matchId: match.record._id,
          confidence: match.confidence,
          pointsAwarded: points,
          cashbackAwarded: cashback
        },
        ipAddress: '127.0.0.1',
        userAgent: 'ReconciliationService'
      });

      return {
        scanUploadId: scanUpload._id,
        status: 'reconciled',
        matchType: match.type,
        matchId: match.record._id,
        confidence: match.confidence,
        pointsAwarded: points,
        cashbackAwarded: cashback
      };
    } catch (error) {
      console.error('Error processing match:', error);
      throw error;
    }
  }

  /**
   * Reconcile billing company invoices with local data
   */
  async reconcileBillingInvoices() {
    try {
      const unreconciledInvoices = await BillingCompanyInvoice.findUnreconciled();
      const reconciliationResults = [];

      for (const invoice of unreconciledInvoices) {
        const result = await this.reconcileSingleBillingInvoice(invoice);
        reconciliationResults.push(result);
      }

      return {
        success: true,
        processed: reconciliationResults.length,
        results: reconciliationResults
      };
    } catch (error) {
      console.error('Billing invoice reconciliation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reconcile a single billing company invoice
   */
  async reconcileSingleBillingInvoice(invoice) {
    try {
      // Try to match with purchase entries
      const purchaseEntryMatch = await this.findPurchaseEntryForInvoice(invoice);
      
      // Try to match with online purchases
      const onlinePurchaseMatch = await this.findOnlinePurchaseForInvoice(invoice);
      
      // Try to match with scan uploads
      const scanUploadMatch = await this.findScanUploadForInvoice(invoice);

      const bestMatch = this.selectBestMatch([
        purchaseEntryMatch,
        onlinePurchaseMatch,
        scanUploadMatch
      ]);

      if (bestMatch && bestMatch.confidence >= this.matchThreshold) {
        return await this.processBillingInvoiceMatch(invoice, bestMatch);
      } else {
        return {
          invoiceId: invoice._id,
          status: 'no_match',
          confidence: bestMatch?.confidence || 0,
          message: 'No confident match found'
        };
      }
    } catch (error) {
      console.error(`Error reconciling billing invoice ${invoice._id}:`, error);
      return {
        invoiceId: invoice._id,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Find matching purchase entry for billing invoice
   */
  async findPurchaseEntryForInvoice(invoice) {
    try {
      const matches = await PurchaseEntry.find({
        userId: invoice.userId,
        storeId: invoice.storeId,
        amount: {
          $gte: invoice.amount - this.amountTolerance,
          $lte: invoice.amount + this.amountTolerance
        },
        date: {
          $gte: new Date(invoice.date.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(invoice.date.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (matches.length === 0) return null;

      const bestMatch = matches.reduce((best, current) => {
        const amountDiff = Math.abs(current.amount - invoice.amount);
        const dateDiff = Math.abs(current.date.getTime() - invoice.date.getTime());
        
        const currentScore = this.calculateMatchScore(amountDiff, dateDiff);
        const bestScore = this.calculateMatchScore(
          Math.abs(best.amount - invoice.amount),
          Math.abs(best.date.getTime() - invoice.date.getTime())
        );

        return currentScore > bestScore ? current : best;
      });

      const amountDiff = Math.abs(bestMatch.amount - invoice.amount);
      const dateDiff = Math.abs(bestMatch.date.getTime() - invoice.date.getTime());
      const confidence = this.calculateMatchScore(amountDiff, dateDiff);

      return {
        type: 'purchase_entry',
        record: bestMatch,
        confidence,
        amountDiff,
        dateDiff
      };
    } catch (error) {
      console.error('Error finding purchase entry for invoice:', error);
      return null;
    }
  }

  /**
   * Find matching online purchase for billing invoice
   */
  async findOnlinePurchaseForInvoice(invoice) {
    try {
      const matches = await OnlinePurchase.find({
        userId: invoice.userId,
        amount: {
          $gte: invoice.amount - this.amountTolerance,
          $lte: invoice.amount + this.amountTolerance
        },
        purchaseDate: {
          $gte: new Date(invoice.date.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(invoice.date.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (matches.length === 0) return null;

      const bestMatch = matches.reduce((best, current) => {
        const amountDiff = Math.abs(current.amount - invoice.amount);
        const dateDiff = Math.abs(current.purchaseDate.getTime() - invoice.date.getTime());
        
        const currentScore = this.calculateMatchScore(amountDiff, dateDiff);
        const bestScore = this.calculateMatchScore(
          Math.abs(best.amount - invoice.amount),
          Math.abs(best.purchaseDate.getTime() - invoice.date.getTime())
        );

        return currentScore > bestScore ? current : best;
      });

      const amountDiff = Math.abs(bestMatch.amount - invoice.amount);
      const dateDiff = Math.abs(bestMatch.purchaseDate.getTime() - invoice.date.getTime());
      const confidence = this.calculateMatchScore(amountDiff, dateDiff);

      return {
        type: 'online_purchase',
        record: bestMatch,
        confidence,
        amountDiff,
        dateDiff
      };
    } catch (error) {
      console.error('Error finding online purchase for invoice:', error);
      return null;
    }
  }

  /**
   * Find matching scan upload for billing invoice
   */
  async findScanUploadForInvoice(invoice) {
    try {
      const matches = await ScanUpload.find({
        userId: invoice.userId,
        storeId: invoice.storeId,
        amount: {
          $gte: invoice.amount - this.amountTolerance,
          $lte: invoice.amount + this.amountTolerance
        },
        date: {
          $gte: new Date(invoice.date.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(invoice.date.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (matches.length === 0) return null;

      const bestMatch = matches.reduce((best, current) => {
        const amountDiff = Math.abs(current.amount - invoice.amount);
        const dateDiff = Math.abs(current.date.getTime() - invoice.date.getTime());
        
        const currentScore = this.calculateMatchScore(amountDiff, dateDiff);
        const bestScore = this.calculateMatchScore(
          Math.abs(best.amount - invoice.amount),
          Math.abs(best.date.getTime() - invoice.date.getTime())
        );

        return currentScore > bestScore ? current : best;
      });

      const amountDiff = Math.abs(bestMatch.amount - invoice.amount);
      const dateDiff = Math.abs(bestMatch.date.getTime() - invoice.date.getTime());
      const confidence = this.calculateMatchScore(amountDiff, dateDiff);

      return {
        type: 'scan_upload',
        record: bestMatch,
        confidence,
        amountDiff,
        dateDiff
      };
    } catch (error) {
      console.error('Error finding scan upload for invoice:', error);
      return null;
    }
  }

  /**
   * Process a successful billing invoice match
   */
  async processBillingInvoiceMatch(invoice, match) {
    try {
      // Mark invoice as reconciled
      await invoice.markAsReconciled(
        match.type === 'purchase_entry' ? match.record._id : null,
        match.type === 'online_purchase' ? match.record._id : null,
        match.type === 'scan_upload' ? match.record._id : null,
        match.confidence
      );

      // Award points and cashback if not already awarded
      if (invoice.pointsAwarded === 0 && invoice.cashbackAwarded === 0) {
        const points = Math.floor(invoice.amount * 0.1);
        const cashback = invoice.amount * 0.02;
        
        // Get commission settings that were active at the time of the invoice
        const CommissionSettings = require('../models/CommissionSettings');
        const commissionSettingsModel = new CommissionSettings();
        const commissionSettings = await commissionSettingsModel.model.getSettingsAtTime(invoice.createdAt);
        
        // Calculate commission based on settings (using lead tier as default for reconciliation)
        const baseCommissionRate = commissionSettings.base_commission_rate || 5.0;
        const baseCommission = (invoice.amount * baseCommissionRate) / 100;
        const leadMultiplier = commissionSettings.tier_multipliers?.lead || 1.0;
        const commission = baseCommission * leadMultiplier;

        await invoice.awardPointsAndCashback(points, cashback, commission);

        // Create points transaction
        await PointsTransaction.create({
          userId: invoice.userId,
          points: points,
          type: 'earned',
          source: 'billing_invoice_reconciled',
          referenceId: invoice._id,
          description: `Points earned from reconciled billing invoice - ${invoice.invoiceId}`
        });

        // Create cashback transaction
        await CashbackTransaction.create({
          userId: invoice.userId,
          amount: cashback,
          type: 'earned',
          source: 'billing_invoice_reconciled',
          referenceId: invoice._id,
          description: `Cashback earned from reconciled billing invoice - ${invoice.invoiceId}`
        });
      }

      return {
        invoiceId: invoice._id,
        status: 'reconciled',
        matchType: match.type,
        matchId: match.record._id,
        confidence: match.confidence
      };
    } catch (error) {
      console.error('Error processing billing invoice match:', error);
      throw error;
    }
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats() {
    try {
      const stats = await Promise.all([
        ScanUpload.countDocuments({ status: 'provisional' }),
        ScanUpload.countDocuments({ status: 'final' }),
        ScanUpload.countDocuments({ status: 'rejected' }),
        BillingCompanyInvoice.countDocuments({
          'reconciliationData.matchedPurchaseEntry': { $exists: false },
          'reconciliationData.matchedOnlinePurchase': { $exists: false },
          'reconciliationData.matchedScanUpload': { $exists: false }
        })
      ]);

      return {
        pendingScanUploads: stats[0],
        reconciledScanUploads: stats[1],
        rejectedScanUploads: stats[2],
        unreconciledBillingInvoices: stats[3]
      };
    } catch (error) {
      console.error('Error getting reconciliation stats:', error);
      throw error;
    }
  }
}

module.exports = new ReconciliationService();