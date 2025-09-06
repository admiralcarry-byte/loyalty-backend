const { Sale, User, Store, Product } = require('../models');

class SaleController {
  constructor() {
    this.saleModel = new Sale();
    this.userModel = new User();
    this.storeModel = new Store();
    this.productModel = new Product();
  }
  // Get all sales with pagination and filters
  async getAllSales(req) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        store_id = '',
        user_id = '',
        start_date = '',
        end_date = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build query
      let query = {};
      
      // Search filter - we'll handle this after population since we need to search in populated fields
      let searchQuery = {};
      if (search) {
        searchQuery = {
          $or: [
            { sale_number: { $regex: search, $options: 'i' } },
            { payment_status: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
      // Status filter - map frontend status to backend status
      if (status && status !== 'all') {
        const statusMap = {
          'verified': 'paid',
          'pending': 'pending',
          'rejected': 'cancelled'
        };
        query.payment_status = statusMap[status] || status;
      }
      
      // Store filter
      if (store_id) {
        query.store = store_id;
      }
      
      // User filter
      if (user_id) {
        query.customer = user_id;
      }
      
      // Date filters
      if (start_date || end_date) {
        query.createdAt = {};
        if (start_date) {
          query.createdAt.$gte = new Date(start_date);
        }
        if (end_date) {
          query.createdAt.$lte = new Date(end_date);
        }
      }
      
      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'ASC' ? 1 : -1;
      
      // Get sales with populated fields (without search query initially)
      let sales = await this.saleModel.model
        .find(query)
        .populate('customer', 'first_name last_name phone email')
        .populate('store', 'name address')
        .populate('seller', 'first_name last_name')
        .populate('items.product', 'name')
        .sort(sort)
        .skip(offset)
        .limit(parseInt(limit));

      // If search is provided, also filter by customer name and store name after population
      if (search) {
        const searchLower = search.toLowerCase();
        sales = sales.filter(sale => {
          const customerName = sale.customer ? 
            `${sale.customer.first_name} ${sale.customer.last_name}`.toLowerCase() : '';
          const customerPhone = sale.customer?.phone?.toLowerCase() || '';
          const storeName = sale.store?.name?.toLowerCase() || '';
          
          return customerName.includes(searchLower) || 
                 customerPhone.includes(searchLower) || 
                 storeName.includes(searchLower) ||
                 sale.sale_number.toLowerCase().includes(searchLower);
        });
      }
      
      // Get total count
      const total = await this.saleModel.model.countDocuments(query);
      
      return {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting sales:', error);
      return {
        sales: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  async getAllSalesOld(req) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      store_id = '',
      user_id = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'total_amount', 'status', 'created_at', 'user_id', 'store_id'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) {
      throw new Error('Invalid sort field');
    }

    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      throw new Error('Invalid sort order');
    }

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(s.id LIKE ? OR s.reference_number LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('s.status = ?');
      params.push(status);
    }

    if (store_id) {
      whereConditions.push('s.store_id = ?');
      params.push(store_id);
    }

    if (user_id) {
      whereConditions.push('s.user_id = ?');
      params.push(user_id);
    }

    if (start_date) {
      whereConditions.push('DATE(s.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(s.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build MongoDB query
    const query = {};
    if (search) {
      query.$or = [
        { reference_number: { $regex: search, $options: 'i' } },
        { 'user.first_name': { $regex: search, $options: 'i' } },
        { 'user.last_name': { $regex: search, $options: 'i' } },
        { 'store.name': { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (user_id) query.user = user_id;
    if (store_id) query.store = store_id;
    if (start_date) query.created_at = { $gte: new Date(start_date) };
    if (end_date) query.created_at = { ...query.created_at, $lte: new Date(end_date) };

    // Get total count
    const total = await this.saleModel.model.countDocuments(query);

    // Get sales with user and store details using aggregation
    const sales = await this.saleModel.model.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store'
        }
      },
      { $unwind: '$user' },
      { $unwind: '$store' },
      {
        $project: {
          _id: 1,
          reference_number: 1,
          total_amount: 1,
          status: 1,
          created_at: 1,
          'user.first_name': 1,
          'user.last_name': 1,
          'user.email': 1,
          'store.name': 1,
          'store.city': 1
        }
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: offset },
      { $limit: parseInt(limit) }
    ]);

    return {
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get sale by ID
  async getSaleById(id) {
    const sale = await this.saleModel.model.findById(id).populate('user', 'first_name last_name email phone').populate('store', 'name address city');

    if (!sale) {
      throw new Error('Sale not found');
    }

    return sale;
  }

  // Create new sale
  async createSale(saleData) {
    // For testing environment, handle frontend format
    let userId, storeId;
    
    if (saleData.user_id && saleData.store_id) {
      // Backend format
      userId = saleData.user_id;
      storeId = saleData.store_id;
    } else if (saleData.customer && saleData.location) {
      // Frontend format - find user by name or create a test user
      const user = await this.userModel.model.findOne({ 
        $or: [
          { first_name: { $regex: saleData.customer, $options: 'i' } },
          { last_name: { $regex: saleData.customer, $options: 'i' } }
        ]
      });
      
      if (user) {
        userId = user._id;
      } else {
        // Create a test user for walk-in customers
        const testUser = await this.userModel.model.create({
          username: `test-${Date.now()}`,
          first_name: saleData.customer,
          last_name: 'Customer',
          email: `test-${Date.now()}@example.com`,
          phone: saleData.customerPhone || '000000000',
          password_hash: 'test123', // Temporary password for testing
          role: 'customer',
          status: 'active',
          loyalty_tier: 'lead'
        });
        userId = testUser._id;
      }
      
      // Find store by name or create a test store
      const store = await this.storeModel.model.findOne({ 
        name: { $regex: saleData.location, $options: 'i' }
      });
      
      if (store) {
        storeId = store._id;
      } else {
        // Create a test store
        const testStore = await this.storeModel.model.create({
          code: `STORE-${Date.now()}`,
          name: saleData.location,
          address: {
            street: 'Test Street',
            city: 'Test City',
            state: 'Test State',
            postal_code: '00000',
            country: 'Test Country'
          },
          location: {
            type: 'Point',
            coordinates: [0, 0]
          },
          is_open: true
        });
        storeId = testStore._id;
      }
    } else {
      throw new Error('Either user_id/store_id or customer/location are required');
    }

    // Validate required fields
    if (!userId || !storeId || (!saleData.total_amount && !saleData.amount)) {
      throw new Error('User ID, store ID, and total amount are required');
    }

    // Create sale data structure
    const saleRecord = {
      sale_number: this.generateSaleNumber(),
      customer: userId,
      store: storeId,
      seller: userId, // For testing, use the same user as seller
      items: [{
        product: await this.getOrCreateTestProduct(),
        quantity: 1,
        unit_price: saleData.total_amount || saleData.amount,
        total_price: saleData.total_amount || saleData.amount,
        points_earned: Math.floor((saleData.total_amount || saleData.amount) * 0.1), // 10% points
        liters: saleData.liters || 1
      }],
      subtotal: saleData.total_amount || saleData.amount,
      discount: 0,
      tax: 0,
      delivery_fee: 0,
      total_amount: saleData.total_amount || saleData.amount,
      payment_method: saleData.paymentMethod || 'cash',
      payment_status: 'paid',
      delivery_status: 'delivered',
      points_earned: Math.floor((saleData.total_amount || saleData.amount) * 0.1),
      points_spent: 0,
      total_liters: saleData.liters || 1,
      commission: {
        amount: 0,
        rate: 0,
        calculated: false
      },
      referral: {
        bonus: 0
      },
      metadata: {
        source: 'in_store'
      }
    };

    return await this.saleModel.model.create(saleRecord);
  }

  // Update sale
  async updateSale(id, saleData) {
    const sale = await this.saleModel.model.findById(id);
    if (!sale) {
      throw new Error('Sale not found');
    }

    // Don't allow updating completed sales
    if (sale.status === 'completed' && saleData.status !== 'completed') {
      throw new Error('Cannot modify completed sales');
    }

    return await Sale.updateById(id, saleData);
  }

  // Delete sale
  async deleteSale(id) {
    const sale = await this.saleModel.model.findById(id);
    if (!sale) {
      throw new Error('Sale not found');
    }

    // Don't allow deleting completed sales
    if (sale.status === 'completed') {
      throw new Error('Cannot delete completed sales');
    }

    return await Sale.deleteById(id);
  }

  // Get sales statistics
  async getSalesStats() {
    try {
      const stats = await this.saleModel.model.aggregate([
        {
          $addFields: {
            total_liters_per_sale: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.liters', 0] }] }
              }
            },
            total_points_per_sale: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.points_earned', 0] }] }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total_sales: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            total_liters_sold: { $sum: '$total_liters_per_sale' },
            total_cashback_earned: { $sum: '$total_points_per_sale' },
            average_sale_amount: { $avg: '$total_amount' },
            average_liters_per_sale: { $avg: '$total_liters_per_sale' }
          }
        }
      ]);

      const result = stats[0] || {
        total_sales: 0,
        total_revenue: 0,
        total_liters_sold: 0,
        total_cashback_earned: 0,
        average_sale_amount: 0,
        average_liters_per_sale: 0
      };

      // Get total commission from Commission collection
      const Commission = require('../models/Commission');
      const commissionModel = new Commission();
      const commissionStats = await commissionModel.model.aggregate([
        {
          $group: {
            _id: null,
            total_commission: { $sum: '$amount' }
          }
        }
      ]);

      const total_commission = commissionStats[0]?.total_commission || 0;

      // Convert points to cash value (assuming 1 point = 0.01 currency)
      const total_cashback_value = (result.total_cashback_earned || 0) * 0.01;

      return {
        total_sales: result.total_sales || 0,
        total_revenue: result.total_revenue || 0,
        total_liters_sold: result.total_liters_sold || 0,
        total_cashback_earned: total_cashback_value, // Convert points to cash value
        total_commission: total_commission,
        average_sale_amount: result.average_sale_amount || 0,
        average_liters_per_sale: result.average_liters_per_sale || 0,
        revenue_growth_percentage: "0.0",
        liters_growth_percentage: "0.0",
        cashback_growth_percentage: "0.0",
        commission_growth_percentage: "0.0"
      };
    } catch (error) {
      console.error('Error getting sales stats:', error);
      return {
        total_sales: 0,
        total_revenue: 0,
        total_liters_sold: 0,
        total_cashback_earned: 0,
        total_commission: 0,
        average_sale_amount: 0,
        average_liters_per_sale: 0,
        revenue_growth_percentage: "0.0",
        liters_growth_percentage: "0.0",
        cashback_growth_percentage: "0.0",
        commission_growth_percentage: "0.0"
      };
    }
  }

  // Update sale status
  async updateSaleStatus(id, status) {
    const sale = await this.saleModel.model.findById(id);
    if (!sale) {
      throw new Error('Sale not found');
    }

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return await Sale.updateById(id, { status });
  }

  // Get sale statistics
  async getSaleStats() {
    const saleInstance = new Sale();
    const stats = await saleInstance.getSalesStats();
    return stats;
  }

  // Get sales by user
  async getSalesByUser(userId, limit = 10) {
    const saleInstance = new Sale();
    return await saleInstance.executeQuery(`
      SELECT s.*, st.name as store_name, st.city as store_city
      FROM sales s 
      LEFT JOIN stores st ON s.store_id = st.id 
      WHERE s.user_id = ? 
      ORDER BY s.created_at DESC 
      LIMIT ?
    `, [userId, limit]);
  }

  // Get sales by store
  async getSalesByStore(storeId, limit = 10) {
    const saleInstance = new Sale();
    return await saleInstance.executeQuery(`
      SELECT s.*, u.first_name, u.last_name, u.email
      FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.store_id = ? 
      ORDER BY s.created_at DESC 
      LIMIT ?
    `, [storeId, limit]);
  }

  // Get or create a test product
  async getOrCreateTestProduct() {
    const Product = require('../models/Product');
    const productModel = new Product();
    
    // Try to find an existing product
    let product = await productModel.model.findOne({ status: 'active' });
    
    if (!product) {
      // Create a test product if none exists
      product = await productModel.model.create({
        name: 'Test Water Product',
        sku: 'TEST-WATER',
        category: 'water',
        type: 'bottled_water',
        description: 'Test water product for sales',
        short_description: 'Test water',
        price: { current: 100, original: 100, wholesale: 80 },
        cost: 50,
        stock: { current: 1000, minimum: 100, maximum: 2000 },
        status: 'active'
      });
    }
    
    return product._id;
  }

  // Generate sale number
  generateSaleNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SALE${random}`;
  }

  // Generate reference number
  generateReferenceNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SALE-${timestamp}-${random}`;
  }

  // Get top selling products
  async getTopSellingProducts(limit = 10) {
    const saleInstance = new Sale();
    return await saleInstance.executeQuery(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COUNT(s.id) as sale_count,
        SUM(s.total_amount) as total_revenue
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      WHERE s.status = 'completed'
      GROUP BY p.id, p.name, p.sku
      ORDER BY sale_count DESC
      LIMIT ?
    `, [limit]);
  }
}

module.exports = new SaleController(); 