const axios = require('axios');
const { AuditLog, BillingCompanyInvoice } = require('../models');

class BillingCompanyService {
  constructor() {
    this.apiKey = process.env.BILLING_COMPANY_API_KEY;
    this.baseUrl = process.env.BILLING_COMPANY_BASE_URL || 'https://api.billingcompany.com/v1';
    this.timeout = parseInt(process.env.BILLING_API_TIMEOUT) || 30000;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LoyaltyApp/1.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[BillingCompany API] ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[BillingCompany API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[BillingCompany API] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[BillingCompany API] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Log API call to audit logs
   */
  async logApiCall(action, requestData, responseData, error = null, userId = null) {
    try {
      await AuditLog.create({
        action: `billing_company_api_${action}`,
        userId: userId,
        details: {
          request: requestData,
          response: responseData,
          error: error ? error.message : null,
          timestamp: new Date()
        },
        ipAddress: '127.0.0.1', // Will be updated by middleware
        userAgent: 'BillingCompanyService'
      });
    } catch (logError) {
      console.error('Failed to log API call:', logError);
    }
  }

  /**
   * Fetch invoices from billing company with pagination
   */
  async fetchInvoices(options = {}, userId = null) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      status,
      userId: filterUserId
    } = options;

    try {
      const params = {
        page,
        limit,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(status && { status }),
        ...(filterUserId && { user_id: filterUserId })
      };

      const response = await this.client.get('/invoices', { params });
      
      await this.logApiCall('fetch_invoices', params, response.data, null, userId);

      // Cache invoices in local database
      if (response.data.invoices && Array.isArray(response.data.invoices)) {
        await this.cacheInvoices(response.data.invoices);
      }

      return {
        success: true,
        data: response.data,
        cached: true
      };
    } catch (error) {
      await this.logApiCall('fetch_invoices', options, null, error, userId);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Fetch specific invoice by ID
   */
  async fetchInvoiceById(invoiceId, userId = null) {
    try {
      const response = await this.client.get(`/invoices/${invoiceId}`);
      
      await this.logApiCall('fetch_invoice_by_id', { invoiceId }, response.data, null, userId);

      // Cache the invoice
      if (response.data.invoice) {
        await this.cacheInvoices([response.data.invoice]);
      }

      return {
        success: true,
        data: response.data,
        cached: true
      };
    } catch (error) {
      await this.logApiCall('fetch_invoice_by_id', { invoiceId }, null, error, userId);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Create new invoice
   */
  async createInvoice(invoiceData, userId = null) {
    try {
      const response = await this.client.post('/invoices', invoiceData);
      
      await this.logApiCall('create_invoice', invoiceData, response.data, null, userId);

      // Cache the created invoice
      if (response.data.invoice) {
        await this.cacheInvoices([response.data.invoice]);
      }

      return {
        success: true,
        data: response.data,
        cached: true
      };
    } catch (error) {
      await this.logApiCall('create_invoice', invoiceData, null, error, userId);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Process refund for an invoice
   */
  async processRefund(invoiceId, refundData, userId = null) {
    try {
      const response = await this.client.post(`/invoices/${invoiceId}/refund`, refundData);
      
      await this.logApiCall('process_refund', { invoiceId, ...refundData }, response.data, null, userId);

      // Update cached invoice
      if (response.data.invoice) {
        await this.cacheInvoices([response.data.invoice]);
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      await this.logApiCall('process_refund', { invoiceId, ...refundData }, null, error, userId);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Get billing statistics
   */
  async getStatistics(options = {}, userId = null) {
    const {
      startDate,
      endDate,
      groupBy = 'day'
    } = options;

    try {
      const params = {
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        group_by: groupBy
      };

      const response = await this.client.get('/statistics', { params });
      
      await this.logApiCall('get_statistics', params, response.data, null, userId);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      await this.logApiCall('get_statistics', options, null, error, userId);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Cache invoices in local database
   */
  async cacheInvoices(invoices) {
    try {
      for (const invoice of invoices) {
        const existingInvoice = await BillingCompanyInvoice.findOne({ 
          invoiceId: invoice.id 
        });

        if (existingInvoice) {
          // Update existing invoice
          await BillingCompanyInvoice.updateOne(
            { invoiceId: invoice.id },
            {
              $set: {
                amount: invoice.amount,
                status: invoice.status,
                paymentMethod: invoice.payment_method,
                date: new Date(invoice.date),
                externalData: {
                  originalInvoiceData: invoice,
                  lastSyncStatus: 'success'
                },
                syncedAt: new Date()
              }
            }
          );
        } else {
          // Create new invoice
          await BillingCompanyInvoice.create({
            invoiceId: invoice.id,
            userId: invoice.user_id,
            storeId: invoice.store_id,
            amount: invoice.amount,
            status: invoice.status,
            paymentMethod: invoice.payment_method,
            date: new Date(invoice.date),
            externalData: {
              originalInvoiceData: invoice,
              lastSyncStatus: 'success'
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to cache invoices:', error);
      throw error;
    }
  }

  /**
   * Sync all invoices for a user
   */
  async syncUserInvoices(userId, options = {}) {
    try {
      const result = await this.fetchInvoices({
        ...options,
        userId
      }, userId);

      if (result.success) {
        return {
          success: true,
          message: `Synced ${result.data.invoices?.length || 0} invoices for user ${userId}`,
          data: result.data
        };
      } else {
        return result;
      }
    } catch (error) {
      await this.logApiCall('sync_user_invoices', { userId, ...options }, null, error, userId);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for billing company API
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      
      return {
        success: true,
        status: 'healthy',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get API rate limit information
   */
  async getRateLimitInfo() {
    try {
      const response = await this.client.get('/rate-limit');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BillingCompanyService();