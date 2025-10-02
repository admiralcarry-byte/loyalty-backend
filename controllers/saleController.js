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
        query.store_id = store_id;
      }
      
      // User filter
      if (user_id) {
        query.user_id = user_id;
      }
      
      // Date filters
      if (start_date || end_date) {
        query.created_at = {};
        if (start_date) {
          query.created_at.$gte = new Date(start_date);
        }
        if (end_date) {
          query.created_at.$lte = new Date(end_date);
        }
      }
      
      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'ASC' ? 1 : -1;
      
      // Get sales with populated fields (without search query initially)
      let sales = await this.saleModel.model
        .find(query)
        .populate('user_id', 'first_name last_name phone email')
        .populate('store_id', 'name address city country')
        .populate('product_id', 'name')
        .sort(sort)
        .skip(offset)
        .limit(parseInt(limit));

      // If search is provided, also filter by customer name and store name after population
      if (search) {
        const searchLower = search.toLowerCase();
        sales = sales.filter(sale => {
          const customerName = sale.user_id ? 
            `${sale.user_id.first_name} ${sale.user_id.last_name}`.toLowerCase() : '';
          const customerPhone = sale.user_id?.phone?.toLowerCase() || '';
          const storeName = sale.store_id?.name?.toLowerCase() || '';
          
          return customerName.includes(searchLower) || 
                 customerPhone.includes(searchLower) || 
                 storeName.includes(searchLower) ||
                 sale.sale_number.toLowerCase().includes(searchLower);
        });
      }
      
      // Get total count
      const total = await this.saleModel.model.countDocuments(query);
      
      // Get store names for sales that have store_number but no store_id
      const storeNumbers = sales
        .filter(sale => sale.store_number && !sale.store_id)
        .map(sale => sale.store_number);
      
      const Store = require('../models/Store');
      const storeModel = new Store();
      const storesByNumber = new Map();
      
      if (storeNumbers.length > 0) {
        const stores = await storeModel.model.find({ 
          'address.postal_code': { $in: storeNumbers } 
        }).lean();
        
        stores.forEach(store => {
          storesByNumber.set(store.address.postal_code, store);
        });
      }

      // Format sales data for frontend
      const formattedSales = sales.map(sale => {
        // Use stored commission amount for historical data
        const commissionAmount = sale.commission?.amount || 0;
        
        // Get store information - prioritize store_id, fallback to store_number lookup
        let storeInfo = { name: 'Unknown Store', address: 'N/A', city: 'N/A', country: 'N/A' };
        
        if (sale.store_id) {
          // Use populated store data
          storeInfo = {
            name: sale.store_id.name || 'Unknown Store',
            address: sale.store_id.address?.street || 'N/A',
            city: sale.store_id.address?.city || 'N/A',
            country: sale.store_id.address?.country || 'N/A'
          };
        } else if (sale.store_number && storesByNumber.has(sale.store_number)) {
          // Look up store by store_number
          const store = storesByNumber.get(sale.store_number);
          storeInfo = {
            name: store.name || 'Unknown Store',
            address: store.address?.street || 'N/A',
            city: store.address?.city || 'N/A',
            country: store.address?.country || 'N/A'
          };
        }
        
        // Debug logging
        console.log(`Sale ${sale.sale_number}: Commission data:`, sale.commission ? `$${commissionAmount}` : 'No commission found');
        
        return {
          _id: sale._id,
          id: sale._id,
          sale_number: sale.sale_number,
          transaction_id: sale.transaction_id,
          customer: sale.user_id ? {
            name: `${sale.user_id.first_name || 'Unknown'} ${sale.user_id.last_name || 'Customer'}`,
            phone: sale.user_id.phone || 'N/A',
            email: sale.user_id.email || 'N/A'
          } : { name: 'Walk-in Customer', phone: 'N/A', email: 'N/A' },
          store: storeInfo,
          product: sale.product_id ? {
            name: sale.product_id.name
          } : { name: 'Unknown Product' },
          quantity: sale.quantity,
          total_liters: sale.quantity, // Use quantity as liters for now
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          cashback_earned: sale.cashback_earned || 0,
          commission: commissionAmount,
          payment_status: sale.payment_status,
          order_status: sale.order_status,
          payment_method: sale.payment_method,
          created_at: sale.createdAt,
          notes: sale.notes
        };
      });

      return {
        sales: formattedSales,
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
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'total_amount', 'status', 'createdAt', 'user_id', 'store_id'];
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
    if (start_date) query.createdAt = { $gte: new Date(start_date) };
    if (end_date) query.createdAt = { ...query.createdAt, $lte: new Date(end_date) };

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
      console.log(`\n🔍 CUSTOMER LOOKUP DEBUG:`);
      console.log(`   Looking for customer: ${saleData.customer}`);
      
      const user = await this.userModel.model.findOne({ 
        $or: [
          { first_name: { $regex: saleData.customer, $options: 'i' } },
          { last_name: { $regex: saleData.customer, $options: 'i' } }
        ]
      });
      
      if (user) {
        userId = user._id;
        console.log(`   Found user: ${user.first_name} ${user.last_name} (ID: ${userId})`);
        console.log(`   User phone: ${user.phone}`);
        console.log(`   User tier: ${user.loyalty_tier}`);
      } else {
        // For production: Don't create test users automatically
        // Instead, require valid user ID or throw an error
        console.log(`   ❌ User not found for customer: ${saleData.customer}`);
        throw new Error(`User not found for customer: ${saleData.customer}. Please ensure the customer exists in the system or provide a valid user_id.`);
      }
      
      // Find store by name or create a test store
      const store = await this.storeModel.model.findOne({ 
        name: { $regex: saleData.location, $options: 'i' }
      });
      
      if (store) {
        storeId = store._id;
      } else {
        // For production: Don't create test stores automatically
        // Instead, require valid store ID or throw an error
        throw new Error(`Store not found for location: ${saleData.location}. Please ensure the store exists in the system or provide a valid store_id.`);
      }
    } else {
      throw new Error('Either user_id/store_id or customer/location are required');
    }

    // Validate required fields
    if (!userId || !storeId || (!saleData.total_amount && !saleData.amount)) {
      throw new Error('User ID, store ID, and total amount are required');
    }

    // Get user details for tier information
    console.log(`\n🔍 USER LOOKUP DEBUG:`);
    console.log(`   Looking up user with ID: ${userId}`);
    const user = await this.userModel.model.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`   Found user: ${user.first_name} ${user.last_name}`);
    console.log(`   User phone: ${user.phone}`);
    console.log(`   User current tier: ${user.loyalty_tier}`);
    console.log(`   User total liters: ${user.total_liters}`);

    // Get or create test product
    const productId = await this.getOrCreateTestProduct();
    const totalAmount = saleData.total_amount || saleData.amount;
    const liters = saleData.liters || 1;
    const quantity = liters; // Use liters as quantity for water sales
    const unitPrice = totalAmount / quantity; // Calculate unit price based on quantity

    // Get commission settings - always use current active settings for new purchases
    let commissionSettings;
    if (saleData.commission_settings_id) {
      // Use specific settings ID if provided
      const CommissionSettings = require('../models/CommissionSettings');
      const commissionSettingsModel = new CommissionSettings();
      commissionSettings = await commissionSettingsModel.model.findById(saleData.commission_settings_id);
    } else {
      // Always use current active settings for new purchases
      const CommissionSettings = require('../models/CommissionSettings');
      const commissionSettingsModel = new CommissionSettings();
      commissionSettings = await commissionSettingsModel.model.getCurrentSettings();
    }
    
    // Update user's total liters and loyalty tier first
    let updatedUser = user;
    try {
      console.log(`\n🔄 USER TIER UPDATE DEBUG:`);
      console.log(`   Before update - Tier: ${user.loyalty_tier}, Liters: ${user.total_liters}`);
      console.log(`   Adding ${liters}L and $${totalAmount} to user totals`);
      
      const User = require('../models/User');
      const userModel = new User();
      updatedUser = await userModel.updateTotalLitersAndTier(userId, liters, totalAmount);
      
      console.log(`✅ User ${userId} tier updated to: ${updatedUser.loyalty_tier}`);
      console.log(`🔍 Updated user object:`, JSON.stringify({
        id: updatedUser._id,
        name: updatedUser.first_name,
        tier: updatedUser.loyalty_tier,
        liters: updatedUser.total_liters,
        phone: updatedUser.phone
      }, null, 2));
    } catch (error) {
      console.error('Error updating user liters and tier:', error);
      // Continue with original user data if tier update fails
      console.log(`⚠️ Using original user tier: ${user.loyalty_tier}`);
    }
    
    // Calculate commission and cashback based on updated user tier
    console.log(`\n🔢 COMMISSION CALCULATION DEBUG:`);
    console.log(`   Customer: ${updatedUser.first_name} ${updatedUser.last_name} (ID: ${userId})`);
    console.log(`   Phone: ${updatedUser.phone}`);
    console.log(`   Current Tier: ${updatedUser.loyalty_tier}`);
    console.log(`   Purchase Amount: $${totalAmount}`);
    console.log(`   Liters: ${liters}L`);
    console.log(`   Commission Settings:`, {
      base_rate: commissionSettings.base_commission_rate,
      cashback_rate: commissionSettings.cashback_rate,
      tier_multipliers: commissionSettings.tier_multipliers
    });
    
    const { commissionAmount, commissionRate, cashbackAmount } = await this.calculateCommissionAndCashback(
      totalAmount, 
      liters, 
      updatedUser.loyalty_tier, 
      commissionSettings
    );
    
    console.log(`💰 FINAL CALCULATIONS:`);
    console.log(`   Commission: $${commissionAmount} (${commissionRate}%)`);
    console.log(`   Cashback: $${cashbackAmount}`);
    console.log(`   Expected for ${updatedUser.loyalty_tier} tier: Commission should be ${updatedUser.loyalty_tier === 'platinum' ? '3x' : updatedUser.loyalty_tier === 'gold' ? '1.5x' : updatedUser.loyalty_tier === 'silver' ? '1.2x' : '1x'} multiplier`);
    console.log(`   ==========================================\n`);
    
    // Display comprehensive purchase summary
    console.log(`\n🛒 PURCHASE SUMMARY:`);
    console.log(`   ========================================`);
    console.log(`   Customer Name: ${updatedUser.first_name} ${updatedUser.last_name}`);
    console.log(`   Email: ${updatedUser.email || 'Not provided'}`);
    console.log(`   Phone: ${updatedUser.phone}`);
    console.log(`   Loyalty Tier: ${updatedUser.loyalty_tier.toUpperCase()}`);
    console.log(`   Liters Purchased: ${liters}L`);
    console.log(`   Total Payment: $${totalAmount}`);
    console.log(`   Commission Received: $${commissionAmount}`);
    console.log(`   Cashback Earned: $${cashbackAmount}`);
    console.log(`   ========================================\n`);
    

    // Create sale data structure with required individual fields
    const saleRecord = {
      sale_number: this.generateSaleNumber(),
      transaction_id: this.generateReferenceNumber(),
      user_id: userId,
      store_id: storeId,
      product_id: productId,
      quantity: quantity,
      unit_price: unitPrice,
      subtotal: totalAmount,
      total_amount: totalAmount,
      customer: userId,
      store: storeId,
      seller: userId, // For testing, use the same user as seller
      items: [{
        product: productId,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalAmount,
        points_earned: Math.floor(totalAmount * 0.1), // 10% points
        liters: liters
      }],
      discount_amount: 0,
      tax_amount: 0,
      payment_method: saleData.paymentMethod || 'cash',
      payment_status: 'paid',
      delivery_status: 'delivered',
      points_earned: Math.floor(totalAmount * 0.1),
      points_spent: 0,
      total_liters: liters,
      cashback_earned: cashbackAmount,
      commission: {
        amount: commissionAmount,
        rate: commissionRate,
        calculated: true,
        tier: updatedUser.loyalty_tier,
        settings_used: commissionSettings._id || 'current'
      },
      referral: {
        bonus: 0
      },
      metadata: {
        source: 'in_store',
        commission_settings_snapshot: {
          base_rate: commissionSettings.base_commission_rate,
          tier_multipliers: commissionSettings.tier_multipliers,
          commission_cap: commissionSettings.commission_cap
        }
      }
    };

    const createdSale = await this.saleModel.model.create(saleRecord);
    
    // Commission data is stored in the sale record itself - no separate commission records needed
    return createdSale;
  }

  // Get commission settings that were active at a specific time
  async getCommissionSettingsAtTime(timestamp) {
    try {
      const CommissionSettings = require('../models/CommissionSettings');
      const commissionSettingsModel = new CommissionSettings();
      
      const settings = await commissionSettingsModel.model.getSettingsAtTime(timestamp);
      
      return settings;
    } catch (error) {
      console.error('Error getting commission settings at time:', error);
      // Return default settings if there's an error
      return {
        base_commission_rate: 5.0,
        cashback_rate: 2.0,
        tier_multipliers: {
          lead: 1.0,
          silver: 1.2,
          gold: 1.5,
          platinum: 2.0
        },
        commission_cap: 1000.0
      };
    }
  }

  // Get dynamic commission amount for a sale based on current settings
  async getCommissionForSale(saleId) {
    try {
      const sale = await this.saleModel.model.findById(saleId).populate('user_id', 'loyalty_tier');
      if (!sale) {
        throw new Error('Sale not found');
      }

      // Get current commission settings
      const CommissionSettings = require('../models/CommissionSettings');
      const commissionSettingsModel = new CommissionSettings();
      const currentSettings = await commissionSettingsModel.model.getCurrentSettings();

      // Calculate commission based on current settings
      const { commissionAmount, commissionRate } = await this.calculateCommissionAndCashback(
        sale.total_amount,
        sale.liters_sold || sale.total_liters || 1,
        sale.user_id.loyalty_tier || 'lead',
        currentSettings
      );

      return {
        commissionAmount,
        commissionRate,
        tier: sale.user_id.loyalty_tier || 'lead',
        settings: {
          base_rate: currentSettings.base_commission_rate,
          tier_multipliers: currentSettings.tier_multipliers,
          commission_cap: currentSettings.commission_cap
        }
      };
    } catch (error) {
      console.error('Error getting commission for sale:', error);
      throw error;
    }
  }

  // Calculate commission and cashback based on settings and user tier
  async calculateCommissionAndCashback(totalAmount, liters, userTier, commissionSettings) {
    try {
      console.log(`\n🧮 CALCULATION METHOD DEBUG:`);
      console.log(`   Input: Amount=$${totalAmount}, Liters=${liters}L, Tier=${userTier}`);
      
      // Calculate commission based on tier multiplier
      const tierKey = userTier.toLowerCase();
      const tierMultiplier = commissionSettings.tier_multipliers[tierKey] || 1.0;
      const baseCommissionRate = commissionSettings.base_commission_rate || 5.0;
      const commissionCap = commissionSettings.commission_cap || 1000.0;
      
      console.log(`   Commission Calculation:`);
      console.log(`     Tier Key: ${tierKey}`);
      console.log(`     Tier Multiplier: ${tierMultiplier}x`);
      console.log(`     Base Commission Rate: ${baseCommissionRate}%`);
      console.log(`     Commission Cap: $${commissionCap}`);
      
      // Calculate base commission
      const baseCommission = (totalAmount * baseCommissionRate) / 100;
      console.log(`     Base Commission: $${totalAmount} × ${baseCommissionRate}% = $${baseCommission}`);
      
      // Apply tier multiplier
      const tierCommission = baseCommission * tierMultiplier;
      console.log(`     Tier Commission: $${baseCommission} × ${tierMultiplier} = $${tierCommission}`);
      
      // Apply commission cap
      const finalCommission = Math.min(tierCommission, commissionCap);
      console.log(`     Final Commission: min($${tierCommission}, $${commissionCap}) = $${finalCommission}`);
      
      // Calculate effective commission rate for display
      const effectiveRate = (finalCommission / totalAmount) * 100;
      console.log(`     Effective Rate: ($${finalCommission} / $${totalAmount}) × 100 = ${effectiveRate}%`);
      
      // Calculate cashback using per-liter calculation as intended by UI
      const cashbackRate = commissionSettings.cashback_rate || 2.0;
      const baseCashback = liters * cashbackRate; // Amount per liter (not percentage)
      const tierCashback = baseCashback * tierMultiplier; // Apply tier multiplier to cashback
      
      console.log(`   Cashback Calculation:`);
      console.log(`     Cashback Rate: $${cashbackRate} per liter`);
      console.log(`     Base Cashback: ${liters}L × $${cashbackRate} = $${baseCashback}`);
      console.log(`     Tier Cashback: $${baseCashback} × ${tierMultiplier} = $${tierCashback}`);
      
      return {
        commissionAmount: Math.round(finalCommission * 100) / 100, // Round to 2 decimal places
        commissionRate: Math.round(effectiveRate * 100) / 100,
        cashbackAmount: Math.round(tierCashback * 100) / 100 // Use tier-multiplied cashback
      };
    } catch (error) {
      console.error('Error calculating commission and cashback:', error);
      // Return default values if calculation fails
      return {
        commissionAmount: (totalAmount * 5.0) / 100,
        commissionRate: 5.0,
        cashbackAmount: liters * 2.0
      };
    }
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
          $group: {
            _id: null,
            total_sales: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
            total_liters_sold: { $sum: '$total_liters' }, // Use total_liters field from schema
            total_cashback_earned: { $sum: '$cashback_earned' }, // Use actual cashback_earned field
            average_sale_amount: { $avg: '$total_amount' },
            average_liters_per_sale: { $avg: '$quantity' }
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

      // Calculate total commission from sales data (Commission table removed)
      const total_commission = result.total_commission || 0;

      return {
        total_sales: result.total_sales || 0,
        total_revenue: result.total_revenue || 0,
        total_liters_sold: result.total_liters_sold || 0,
        total_cashback_earned: result.total_cashback_earned || 0, // Use actual cashback amount
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

  // Get all sales statistics
  async getAllSalesStats() {
    try {
      const saleModel = new Sale();
      
      // Get comprehensive sales statistics
      const stats = await saleModel.executeQuery(`
        SELECT 
          COUNT(*) as total_sales,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sales,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sales,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sales,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_sales,
          SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as average_sale_amount,
          SUM(CASE WHEN status = 'completed' THEN liters ELSE 0 END) as total_liters_sold,
          SUM(CASE WHEN status = 'completed' THEN points_earned ELSE 0 END) as total_points_earned,
          SUM(CASE WHEN status = 'completed' THEN cashback ELSE 0 END) as total_cashback_earned
        FROM sales
      `);

      return stats[0] || {};
    } catch (error) {
      console.error('Get all sales stats error:', error);
      throw error;
    }
  }
}

module.exports = new SaleController(); 