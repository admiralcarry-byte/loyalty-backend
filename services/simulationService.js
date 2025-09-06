const crypto = require('crypto');

class SimulationService {
  constructor() {
    this.simulatedData = this.initializeSimulatedData();
    this.simulationConfig = {
      enableDelays: true,
      defaultDelay: 500,
      errorRate: 0.05,
      enableRandomErrors: true
    };
  }

  // Initialize all simulated data
  initializeSimulatedData() {
    return {
      users: this.generateUsers(),
      stores: this.generateStores(),
      campaigns: this.generateCampaigns(),
      sales: this.generateSales(),
      commissions: this.generateCommissions(),
      billing: this.generateBilling(),
      notifications: this.generateNotifications(),
      reports: this.generateReports(),
      points: this.generatePoints(),
      cashback: this.generateCashback(),
      purchases: this.generatePurchases(),
      onlinePurchases: this.generateOnlinePurchases(),
      wallets: this.generateWallets(),
      influencers: this.generateInfluencers(),
      geolocation: this.generateGeolocation(),
      scanUploads: this.generateScanUploads(),
      billingCompanyInvoices: this.generateBillingCompanyInvoices()
    };
  }

  // Simulate API delay
  async simulateDelay(ms = null) {
    const delay = ms || this.simulationConfig.defaultDelay;
    if (this.simulationConfig.enableDelays) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Simulate random errors
  async simulateRandomError() {
    if (this.simulationConfig.enableRandomErrors && Math.random() < this.simulationConfig.errorRate) {
      throw new Error('Simulated network error');
    }
  }

  // Generate simulated users
  generateUsers() {
    return [
      {
        id: 1,
        username: 'joao.silva',
        email: 'joao.silva@email.com',
        first_name: 'João',
        last_name: 'Silva',
        phone: '+244 923 456 789',
        role: 'customer',
        status: 'active',
        total_liters: 150.5,
        wallet_balance: 250.00,
        points_balance: 1250,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        username: 'maria.santos',
        email: 'maria.santos@email.com',
        first_name: 'Maria',
        last_name: 'Santos',
        phone: '+244 934 567 890',
        role: 'customer',
        status: 'active',
        total_liters: 89.2,
        wallet_balance: 180.50,
        points_balance: 890,
        created_at: '2024-01-16T11:45:00Z',
        updated_at: '2024-01-20T15:20:00Z'
      },
      {
        id: 3,
        username: 'pedro.costa',
        email: 'pedro.costa@email.com',
        first_name: 'Pedro',
        last_name: 'Costa',
        phone: '+244 945 678 901',
        role: 'manager',
        status: 'active',
        total_liters: 0,
        wallet_balance: 0,
        points_balance: 0,
        created_at: '2024-01-10T09:15:00Z',
        updated_at: '2024-01-20T16:45:00Z'
      }
    ];
  }

  // Generate simulated stores
  generateStores() {
    return [
      {
        id: 1,
        name: 'Água TWEZAH - Luanda Centro',
        address: 'Rua Comandante Valódia, Luanda',
        phone: '+244 222 123 456',
        email: 'centro@aguatwezah.ao',
        manager_id: 3,
        status: 'active',
        total_sales: 45600.50,
        total_customers: 1250,
        latitude: -8.8383,
        longitude: 13.2344,
        created_at: '2024-01-01T08:00:00Z'
      },
      {
        id: 2,
        name: 'Água TWEZAH - Talatona',
        address: 'Avenida 4 de Fevereiro, Talatona',
        phone: '+244 222 234 567',
        email: 'talatona@aguatwezah.ao',
        manager_id: 3,
        status: 'active',
        total_sales: 32400.75,
        total_customers: 890,
        latitude: -8.9167,
        longitude: 13.1833,
        created_at: '2024-01-05T09:00:00Z'
      }
    ];
  }

  // Generate simulated campaigns
  generateCampaigns() {
    return [
      {
        id: 1,
        name: 'Verão Refrescante',
        description: 'Campanha de verão com descontos especiais',
        type: 'discount',
        discount_percentage: 15,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-03-31T23:59:59Z',
        status: 'active',
        total_participants: 450,
        total_revenue: 15600.00,
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        name: 'Fidelidade Premium',
        description: 'Programa de fidelidade para clientes premium',
        type: 'loyalty',
        discount_percentage: 20,
        start_date: '2024-01-15T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        total_participants: 280,
        total_revenue: 8900.00,
        created_at: '2024-01-15T14:30:00Z'
      }
    ];
  }

  // Generate simulated sales
  generateSales() {
    return [
      {
        id: 1,
        user_id: 1,
        store_id: 1,
        amount: 150.00,
        liters: 25.5,
        payment_method: 'wallet',
        status: 'completed',
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        user_id: 2,
        store_id: 2,
        amount: 89.50,
        liters: 15.2,
        payment_method: 'cash',
        status: 'completed',
        created_at: '2024-01-20T15:45:00Z'
      }
    ];
  }

  // Generate simulated commissions
  generateCommissions() {
    return [
      {
        id: 1,
        user_id: 1,
        amount: 15.00,
        type: 'referral',
        status: 'pending',
        description: 'Comissão por indicação de cliente',
        created_at: '2024-01-20T16:00:00Z'
      },
      {
        id: 2,
        user_id: 2,
        amount: 8.95,
        type: 'purchase',
        status: 'completed',
        description: 'Comissão por compra',
        created_at: '2024-01-20T16:30:00Z'
      }
    ];
  }

  // Generate simulated billing
  generateBilling() {
    return [
      {
        id: 1,
        user_id: 1,
        amount: 150.00,
        description: 'Compra de água - 25.5L',
        status: 'paid',
        payment_method: 'wallet',
        invoice_number: 'INV-2024-001',
        created_at: '2024-01-20T14:30:00Z',
        paid_at: '2024-01-20T14:32:00Z'
      },
      {
        id: 2,
        user_id: 2,
        amount: 89.50,
        description: 'Compra de água - 15.2L',
        status: 'paid',
        payment_method: 'cash',
        invoice_number: 'INV-2024-002',
        created_at: '2024-01-20T15:45:00Z',
        paid_at: '2024-01-20T15:47:00Z'
      }
    ];
  }

  // Generate simulated notifications
  generateNotifications() {
    return [
      {
        id: 1,
        user_id: 1,
        title: 'Pedido Confirmado',
        message: 'Seu pedido de 25.5L foi confirmado e está sendo processado.',
        type: 'order_confirmation',
        status: 'read',
        created_at: '2024-01-20T14:32:00Z'
      },
      {
        id: 2,
        user_id: 1,
        title: 'Entrega Realizada',
        message: 'Seu pedido foi entregue com sucesso!',
        type: 'delivery_completed',
        status: 'unread',
        created_at: '2024-01-20T16:00:00Z'
      }
    ];
  }

  // Generate simulated reports
  generateReports() {
    return {
      sales: {
        total_sales: 45600.50,
        total_orders: 1250,
        average_order_value: 36.48,
        top_products: ['Água 5L', 'Água 10L', 'Água 20L'],
        sales_by_month: [
          { month: 'Jan', sales: 15600.00 },
          { month: 'Feb', sales: 14200.00 },
          { month: 'Mar', sales: 15800.50 }
        ]
      },
      customers: {
        total_customers: 1250,
        new_customers_this_month: 45,
        repeat_customers: 890,
        average_customer_value: 125.50
      },
      performance: {
        total_revenue: 45600.50,
        total_expenses: 23400.25,
        net_profit: 22200.25,
        profit_margin: 48.7
      }
    };
  }

  // Generate simulated points
  generatePoints() {
    return [
      {
        id: 1,
        user_id: 1,
        points: 150,
        type: 'earned',
        description: 'Pontos ganhos por compra',
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        user_id: 1,
        points: -50,
        type: 'redeemed',
        description: 'Pontos trocados por desconto',
        created_at: '2024-01-20T15:00:00Z'
      }
    ];
  }

  // Generate simulated cashback
  generateCashback() {
    return [
      {
        id: 1,
        user_id: 1,
        amount: 7.50,
        percentage: 5,
        status: 'pending',
        description: 'Cashback da compra de 25.5L',
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        user_id: 2,
        amount: 4.48,
        percentage: 5,
        status: 'completed',
        description: 'Cashback da compra de 15.2L',
        created_at: '2024-01-20T15:45:00Z',
        processed_at: '2024-01-20T16:00:00Z'
      }
    ];
  }

  // Generate simulated purchases
  generatePurchases() {
    return [
      {
        id: 1,
        user_id: 1,
        store_id: 1,
        items: [
          { product: 'Água 5L', quantity: 5, price: 30.00 }
        ],
        total_amount: 150.00,
        status: 'completed',
        payment_method: 'wallet',
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        user_id: 2,
        store_id: 2,
        items: [
          { product: 'Água 10L', quantity: 1, price: 55.00 },
          { product: 'Água 5L', quantity: 1, price: 30.00 }
        ],
        total_amount: 89.50,
        status: 'completed',
        payment_method: 'cash',
        created_at: '2024-01-20T15:45:00Z'
      }
    ];
  }

  // Generate simulated online purchases
  generateOnlinePurchases() {
    return [
      {
        id: 1,
        user_id: 1,
        items: [
          { product: 'Água 20L', quantity: 2, price: 75.00 }
        ],
        total_amount: 150.00,
        delivery_address: 'Rua Comandante Valódia, Luanda',
        delivery_fee: 10.00,
        status: 'processing',
        payment_method: 'wallet',
        created_at: '2024-01-20T16:00:00Z'
      }
    ];
  }

  // Generate simulated wallets
  generateWallets() {
    return {
      providers: [
        {
          id: 1,
          name: 'PIX Wallet',
          type: 'digital_wallet',
          status: 'active',
          commission_rate: 2.5,
          supported_currencies: ['BRL', 'USD'],
          transaction_count: 1247,
          total_volume: 45600.50
        },
        {
          id: 2,
          name: 'Mobile Money',
          type: 'mobile_money',
          status: 'active',
          commission_rate: 3.0,
          supported_currencies: ['AOA', 'USD'],
          transaction_count: 892,
          total_volume: 23400.75
        }
      ],
      transactions: [
        {
          id: 1,
          user_id: 1,
          provider_id: 1,
          transaction_type: 'payment',
          amount: 150.00,
          currency: 'BRL',
          status: 'completed',
          reference: 'PIX-2024-001',
          created_at: '2024-01-20T14:30:00Z'
        }
      ]
    };
  }

  // Generate simulated influencers
  generateInfluencers() {
    return [
      {
        id: 1,
        user_id: 1,
        level: 'bronze',
        followers: 1500,
        engagement_rate: 3.2,
        total_earnings: 450.00,
        status: 'active',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        user_id: 2,
        level: 'silver',
        followers: 5000,
        engagement_rate: 4.8,
        total_earnings: 1200.00,
        status: 'active',
        created_at: '2024-01-10T09:00:00Z'
      }
    ];
  }

  // Generate simulated geolocation data
  generateGeolocation() {
    return {
      stores: [
        {
          id: 1,
          name: 'Água TWEZAH - Luanda Centro',
          latitude: -8.8383,
          longitude: 13.2344,
          address: 'Rua Comandante Valódia, Luanda',
          status: 'active'
        },
        {
          id: 2,
          name: 'Água TWEZAH - Talatona',
          latitude: -8.9167,
          longitude: 13.1833,
          address: 'Avenida 4 de Fevereiro, Talatona',
          status: 'active'
        }
      ],
      deliveries: [
        {
          id: 1,
          user_id: 1,
          latitude: -8.8383,
          longitude: 13.2344,
          status: 'in_progress',
          estimated_arrival: '2024-01-20T17:00:00Z'
        }
      ]
    };
  }

  // Generic CRUD operations
  async getAll(collection, filters = {}) {
    await this.simulateDelay();
    await this.simulateRandomError();
    
    let data = this.simulatedData[collection] || [];
    
    // Apply filters
    if (filters.status) {
      data = data.filter(item => item.status === filters.status);
    }
    if (filters.user_id) {
      data = data.filter(item => item.user_id === filters.user_id);
    }
    
    return data;
  }

  async getById(collection, id) {
    await this.simulateDelay();
    await this.simulateRandomError();
    
    const data = this.simulatedData[collection] || [];
    return data.find(item => item.id === parseInt(id));
  }

  async create(collection, item) {
    await this.simulateDelay(1000);
    await this.simulateRandomError();
    
    const newItem = {
      id: Date.now(),
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.simulatedData[collection].push(newItem);
    return newItem;
  }

  async update(collection, id, updates) {
    await this.simulateDelay(800);
    await this.simulateRandomError();
    
    const index = this.simulatedData[collection].findIndex(item => item.id === parseInt(id));
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    this.simulatedData[collection][index] = {
      ...this.simulatedData[collection][index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return this.simulatedData[collection][index];
  }

  async delete(collection, id) {
    await this.simulateDelay(600);
    await this.simulateRandomError();
    
    const index = this.simulatedData[collection].findIndex(item => item.id === parseInt(id));
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    const deletedItem = this.simulatedData[collection][index];
    this.simulatedData[collection].splice(index, 1);
    
    return deletedItem;
  }

  // Specialized methods for specific features
  async getDashboardStats() {
    await this.simulateDelay();
    await this.simulateRandomError();
    
    return {
      total_users: this.simulatedData.users.length,
      total_sales: this.simulatedData.sales.reduce((sum, sale) => sum + sale.amount, 0),
      total_revenue: 45600.50,
      active_campaigns: this.simulatedData.campaigns.filter(c => c.status === 'active').length,
      pending_orders: this.simulatedData.onlinePurchases.filter(p => p.status === 'processing').length,
      total_stores: this.simulatedData.stores.length
    };
  }

  async getReports(type) {
    await this.simulateDelay(1200);
    await this.simulateRandomError();
    
    return this.simulatedData.reports[type] || {};
  }

  async processPayment(paymentData) {
    await this.simulateDelay(2000);
    await this.simulateRandomError();
    
    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        transaction_id: `TXN-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
        amount: paymentData.amount,
        status: 'completed',
        processed_at: new Date().toISOString()
      };
    } else {
      throw new Error('Payment processing failed');
    }
  }

  async sendNotification(notificationData) {
    await this.simulateDelay(500);
    await this.simulateRandomError();
    
    const notification = {
      id: Date.now(),
      ...notificationData,
      status: 'sent',
      created_at: new Date().toISOString()
    };
    
    this.simulatedData.notifications.push(notification);
    return notification;
  }

  // Generate simulated scan uploads
  generateScanUploads() {
    return [
      {
        id: 1,
        userId: 1,
        storeId: 1,
        invoiceNumber: 'INV-2024-001',
        amount: 150.00,
        date: '2024-01-20T14:30:00Z',
        status: 'provisional',
        filePath: '/uploads/receipts/receipt-1642689000000-123456789.jpg',
        ocrExtractedText: 'SUPERMERCADO ABC\nRua das Flores, 123\nNOTA FISCAL\nNº: 000123456\nTOTAL: R$ 150.00',
        reconciliationData: {
          matchedPurchaseEntry: null,
          matchedOnlinePurchase: null,
          matchedAt: null,
          confidence: 0
        },
        pointsAwarded: 0,
        cashbackAwarded: 0,
        rejectionReason: '',
        processedBy: null,
        processedAt: null,
        createdAt: '2024-01-20T16:00:00Z',
        updatedAt: '2024-01-20T16:00:00Z'
      },
      {
        id: 2,
        userId: 2,
        storeId: 2,
        invoiceNumber: 'INV-2024-002',
        amount: 89.50,
        date: '2024-01-20T15:45:00Z',
        status: 'final',
        filePath: '/uploads/receipts/receipt-1642691100000-987654321.jpg',
        ocrExtractedText: 'FARMÁCIA SAÚDE\nAv. Paulista, 1000\nCUPOM FISCAL\nNº: 987654321\nTOTAL: R$ 89.50',
        reconciliationData: {
          matchedPurchaseEntry: 2,
          matchedOnlinePurchase: null,
          matchedAt: '2024-01-20T16:30:00Z',
          confidence: 0.95
        },
        pointsAwarded: 8,
        cashbackAwarded: 1.79,
        rejectionReason: '',
        processedBy: 3,
        processedAt: '2024-01-20T16:30:00Z',
        createdAt: '2024-01-20T16:15:00Z',
        updatedAt: '2024-01-20T16:30:00Z'
      },
      {
        id: 3,
        userId: 1,
        storeId: 1,
        invoiceNumber: 'INV-2024-003',
        amount: 75.00,
        date: '2024-01-19T10:20:00Z',
        status: 'rejected',
        filePath: '/uploads/receipts/receipt-1642608000000-456789123.jpg',
        ocrExtractedText: 'LOJA XYZ\nRua Principal, 456\nNOTA FISCAL\nNº: 000456789\nTOTAL: R$ 75.00',
        reconciliationData: {
          matchedPurchaseEntry: null,
          matchedOnlinePurchase: null,
          matchedAt: null,
          confidence: 0
        },
        pointsAwarded: 0,
        cashbackAwarded: 0,
        rejectionReason: 'Invoice number does not match store records',
        processedBy: 3,
        processedAt: '2024-01-19T11:00:00Z',
        createdAt: '2024-01-19T10:30:00Z',
        updatedAt: '2024-01-19T11:00:00Z'
      }
    ];
  }

  // Generate simulated billing company invoices
  generateBillingCompanyInvoices() {
    return [
      {
        id: 1,
        invoiceId: 'BC-INV-2024-001',
        userId: 1,
        storeId: 1,
        amount: 150.00,
        status: 'completed',
        paymentMethod: 'card',
        date: '2024-01-20T14:30:00Z',
        syncedAt: '2024-01-20T14:35:00Z',
        externalData: {
          originalInvoiceData: {
            id: 'BC-INV-2024-001',
            user_id: 1,
            store_id: 1,
            amount: 150.00,
            status: 'completed',
            payment_method: 'card',
            date: '2024-01-20T14:30:00Z'
          },
          apiResponse: { success: true, message: 'Invoice retrieved successfully' },
          lastSyncStatus: 'success',
          lastSyncError: null
        },
        reconciliationData: {
          matchedPurchaseEntry: 1,
          matchedOnlinePurchase: null,
          matchedScanUpload: null,
          matchedAt: '2024-01-20T14:40:00Z',
          confidence: 0.98
        },
        pointsAwarded: 15,
        cashbackAwarded: 3.00,
        commissionGenerated: 1.50,
        createdAt: '2024-01-20T14:35:00Z',
        updatedAt: '2024-01-20T14:40:00Z'
      },
      {
        id: 2,
        invoiceId: 'BC-INV-2024-002',
        userId: 2,
        storeId: 2,
        amount: 89.50,
        status: 'completed',
        paymentMethod: 'pix',
        date: '2024-01-20T15:45:00Z',
        syncedAt: '2024-01-20T15:50:00Z',
        externalData: {
          originalInvoiceData: {
            id: 'BC-INV-2024-002',
            user_id: 2,
            store_id: 2,
            amount: 89.50,
            status: 'completed',
            payment_method: 'pix',
            date: '2024-01-20T15:45:00Z'
          },
          apiResponse: { success: true, message: 'Invoice retrieved successfully' },
          lastSyncStatus: 'success',
          lastSyncError: null
        },
        reconciliationData: {
          matchedPurchaseEntry: 2,
          matchedOnlinePurchase: null,
          matchedScanUpload: 2,
          matchedAt: '2024-01-20T16:00:00Z',
          confidence: 0.95
        },
        pointsAwarded: 8,
        cashbackAwarded: 1.79,
        commissionGenerated: 0.90,
        createdAt: '2024-01-20T15:50:00Z',
        updatedAt: '2024-01-20T16:00:00Z'
      },
      {
        id: 3,
        invoiceId: 'BC-INV-2024-003',
        userId: 1,
        storeId: 1,
        amount: 200.00,
        status: 'pending',
        paymentMethod: 'boleto',
        date: '2024-01-21T09:00:00Z',
        syncedAt: '2024-01-21T09:05:00Z',
        externalData: {
          originalInvoiceData: {
            id: 'BC-INV-2024-003',
            user_id: 1,
            store_id: 1,
            amount: 200.00,
            status: 'pending',
            payment_method: 'boleto',
            date: '2024-01-21T09:00:00Z'
          },
          apiResponse: { success: true, message: 'Invoice retrieved successfully' },
          lastSyncStatus: 'success',
          lastSyncError: null
        },
        reconciliationData: {
          matchedPurchaseEntry: null,
          matchedOnlinePurchase: null,
          matchedScanUpload: null,
          matchedAt: null,
          confidence: 0
        },
        pointsAwarded: 0,
        cashbackAwarded: 0,
        commissionGenerated: 0,
        createdAt: '2024-01-21T09:05:00Z',
        updatedAt: '2024-01-21T09:05:00Z'
      },
      {
        id: 4,
        invoiceId: 'BC-INV-2024-004',
        userId: 2,
        storeId: 2,
        amount: 120.00,
        status: 'refunded',
        paymentMethod: 'card',
        date: '2024-01-18T16:20:00Z',
        syncedAt: '2024-01-18T16:25:00Z',
        externalData: {
          originalInvoiceData: {
            id: 'BC-INV-2024-004',
            user_id: 2,
            store_id: 2,
            amount: 120.00,
            status: 'refunded',
            payment_method: 'card',
            date: '2024-01-18T16:20:00Z'
          },
          apiResponse: { success: true, message: 'Invoice retrieved successfully' },
          lastSyncStatus: 'success',
          lastSyncError: null
        },
        reconciliationData: {
          matchedPurchaseEntry: null,
          matchedOnlinePurchase: null,
          matchedScanUpload: null,
          matchedAt: null,
          confidence: 0
        },
        pointsAwarded: 0,
        cashbackAwarded: 0,
        commissionGenerated: 0,
        createdAt: '2024-01-18T16:25:00Z',
        updatedAt: '2024-01-18T16:25:00Z'
      }
    ];
  }

  // Simulate OCR processing
  async simulateOCRProcessing(filePath) {
    await this.simulateDelay(2000);
    await this.simulateRandomError();
    
    // Simulate OCR result
    const mockResults = [
      {
        extractedText: 'SUPERMERCADO ABC\nRua das Flores, 123\nNOTA FISCAL\nNº: 000123456\nTOTAL: R$ 150.00',
        parsedData: {
          invoiceNumber: 'INV-000123456',
          storeName: 'SUPERMERCADO ABC',
          amount: 150.00,
          date: new Date('2024-01-20T14:30:00Z'),
          paymentMethod: 'card'
        },
        confidence: 0.92
      },
      {
        extractedText: 'FARMÁCIA SAÚDE\nAv. Paulista, 1000\nCUPOM FISCAL\nNº: 987654321\nTOTAL: R$ 89.50',
        parsedData: {
          invoiceNumber: 'INV-987654321',
          storeName: 'FARMÁCIA SAÚDE',
          amount: 89.50,
          date: new Date('2024-01-20T15:45:00Z'),
          paymentMethod: 'cash'
        },
        confidence: 0.88
      }
    ];
    
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    return {
      success: true,
      extractedText: randomResult.extractedText,
      parsedData: randomResult.parsedData,
      confidence: randomResult.confidence,
      processingTime: 2000
    };
  }

  // Simulate billing company API calls
  async simulateBillingCompanyAPI(endpoint, method = 'GET', data = null) {
    await this.simulateDelay(1500);
    await this.simulateRandomError();
    
    switch (endpoint) {
      case '/invoices':
        return {
          success: true,
          data: {
            invoices: this.simulatedData.billingCompanyInvoices.slice(0, 10),
            total: this.simulatedData.billingCompanyInvoices.length,
            page: 1,
            limit: 10
          }
        };
      
      case '/invoices/BC-INV-2024-001':
        return {
          success: true,
          data: {
            invoice: this.simulatedData.billingCompanyInvoices[0]
          }
        };
      
      case '/statistics':
        return {
          success: true,
          data: {
            totalInvoices: this.simulatedData.billingCompanyInvoices.length,
            totalAmount: this.simulatedData.billingCompanyInvoices.reduce((sum, inv) => sum + inv.amount, 0),
            completedInvoices: this.simulatedData.billingCompanyInvoices.filter(inv => inv.status === 'completed').length,
            pendingInvoices: this.simulatedData.billingCompanyInvoices.filter(inv => inv.status === 'pending').length
          }
        };
      
      case '/health':
        return {
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
      
      default:
        return {
          success: false,
          error: 'Endpoint not found'
        };
    }
  }

  // Simulate reconciliation process
  async simulateReconciliation(type = 'all') {
    await this.simulateDelay(3000);
    await this.simulateRandomError();
    
    const results = [];
    
    if (type === 'scan_uploads' || type === 'all') {
      const pendingUploads = this.simulatedData.scanUploads.filter(upload => upload.status === 'provisional');
      
      for (const upload of pendingUploads) {
        // Simulate matching logic
        const hasMatch = Math.random() > 0.3; // 70% match rate
        
        if (hasMatch) {
          results.push({
            scanUploadId: upload.id,
            status: 'reconciled',
            matchType: 'purchase_entry',
            matchId: Math.floor(Math.random() * 10) + 1,
            confidence: 0.85 + Math.random() * 0.15,
            pointsAwarded: Math.floor(upload.amount * 0.1),
            cashbackAwarded: upload.amount * 0.02
          });
        } else {
          results.push({
            scanUploadId: upload.id,
            status: 'no_match',
            confidence: 0.3 + Math.random() * 0.4,
            message: 'No confident match found'
          });
        }
      }
    }
    
    if (type === 'billing_invoices' || type === 'all') {
      const unreconciledInvoices = this.simulatedData.billingCompanyInvoices.filter(
        invoice => !invoice.reconciliationData.matchedPurchaseEntry && 
                   !invoice.reconciliationData.matchedOnlinePurchase &&
                   !invoice.reconciliationData.matchedScanUpload
      );
      
      for (const invoice of unreconciledInvoices) {
        const hasMatch = Math.random() > 0.2; // 80% match rate
        
        if (hasMatch) {
          results.push({
            invoiceId: invoice.id,
            status: 'reconciled',
            matchType: 'purchase_entry',
            matchId: Math.floor(Math.random() * 10) + 1,
            confidence: 0.9 + Math.random() * 0.1
          });
        } else {
          results.push({
            invoiceId: invoice.id,
            status: 'no_match',
            confidence: 0.4 + Math.random() * 0.3,
            message: 'No confident match found'
          });
        }
      }
    }
    
    return {
      success: true,
      processed: results.length,
      results
    };
  }
}

// Export singleton instance
module.exports = new SimulationService(); 