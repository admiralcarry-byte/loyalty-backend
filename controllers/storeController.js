const Store = require('../models/Store');

const storeModel = new Store();

class StoreController {
  // Get all stores with pagination and filters
  async getAllStores(req) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        city = ''
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { 'address.street': { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        query.status = status;
      }
      
      if (city) {
        query['address.city'] = { $regex: city, $options: 'i' };
      }

      // Get stores with pagination
      const storeModel = new Store();
      const stores = await storeModel.findAll(query, {
        sort: { created_at: -1 },
        skip: offset,
        limit: parseInt(limit)
      });

      // Get total count
      const total = await storeModel.count(query);
      const pages = Math.ceil(total / limit);

      return {
        stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      };
    } catch (error) {
      console.error('Error getting stores:', error);
      return {
        stores: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  async getAllStoresOld(req) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      city = '',
      country = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'name', 'city', 'country', 'status', 'createdAt'];
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
      whereConditions.push('(name LIKE ? OR address LIKE ? OR phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (city) {
      whereConditions.push('city LIKE ?');
      params.push(`%${city}%`);
    }

    if (country) {
      whereConditions.push('country LIKE ?');
      params.push(`%${country}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build MongoDB query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (city) query.city = city;
    if (type) query.type = type;

    // Get total count
      const total = await storeModel.count(query);

    // Get stores with pagination
    const stores = await storeModel.findAll(query, {
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      limit: parseInt(limit),
      skip: offset
    });

    return {
      stores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get store by ID
  async getStoreById(id) {
    const store = await storeModel.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    // Get store statistics
    const stats = await this.getStoreStats(id);
    store.stats = stats;

    return store;
  }

  // Create new store
  async createStore(storeData) {
    // Transform flat API data to nested database schema
    const transformedData = {
      name: storeData.name,
      status: storeData.status || 'active',
      address: {
        street: storeData.address,
        city: storeData.city,
        state: storeData.state,
        postal_code: storeData.postal_code,
        country: storeData.country || 'Angola'
      },
      contact: {
        phone: storeData.phone,
        email: storeData.email
      },
      manager: storeData.manager || {}
    };

    // Check if store name already exists in the same city
    const existingStore = await storeModel.findOne({
      name: transformedData.name,
      'address.city': transformedData.address.city
    });

    if (existingStore) {
      throw new Error('Store with this name already exists in this city');
    }

    return await storeModel.create(transformedData);
  }


  // Update store
  async updateStore(id, storeData) {
    const store = await storeModel.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    // Transform flat API data to nested database schema
    const transformedData = {
      name: storeData.name,
      status: storeData.status,
      address: {
        street: storeData.address,
        city: storeData.city,
        state: storeData.state,
        postal_code: storeData.postal_code,
        country: storeData.country || 'Angola'
      },
      contact: {
        phone: storeData.phone,
        email: storeData.email
      },
      manager: storeData.manager || {}
    };

    // Check if store name is being changed and if it already exists
    if (storeData.name && storeData.name !== store.name) {
      const existingStore = await storeModel.findOne({
        name: transformedData.name,
        'address.city': transformedData.address.city
      });
      if (existingStore) {
        throw new Error('Store with this name already exists in this city');
      }
    }

    return await storeModel.updateById(id, transformedData);
  }

  // Delete store
  async deleteStore(id) {
    const store = await storeModel.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    // Check if store has any related data
    const hasRelatedData = await this.checkStoreRelatedData(id);
    if (hasRelatedData) {
      throw new Error('Cannot delete store with related data');
    }

    return await storeModel.deleteById(id);
  }

  // Update store status
  async updateStoreStatus(id, status) {
    const store = await storeModel.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    const validStatuses = ['active', 'inactive', 'maintenance', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return await storeModel.updateById(id, { status });
  }

  // Get stores by location
  async getStoresByLocation(latitude, longitude, radius = 10) {
    const query = `
      SELECT 
        *,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance
      FROM stores 
      WHERE status = 'active'
      HAVING distance <= ?
      ORDER BY distance
    `;

    const storeInstance = new Store();
    return await storeInstance.executeQuery(query, [latitude, longitude, latitude, radius]);
  }

  // Get store statistics
  async getStoreStats(storeId) {
    const storeInstance = new Store();
    const stats = await storeInstance.executeQuery(`
      SELECT 
        COUNT(DISTINCT s.id) as total_sales,
        SUM(s.total_amount) as total_revenue,
        COUNT(DISTINCT s.user_id) as unique_customers,
        AVG(s.total_amount) as avg_sale_amount
      FROM sales s
      WHERE s.store_id = ?
    `, [storeId]);

    return stats[0] || {
      total_sales: 0,
      total_revenue: 0,
      unique_customers: 0,
      avg_sale_amount: 0
    };
  }

  // Get all store statistics
  async getAllStoreStats() {
    const storeInstance = new Store();
    const stats = await storeInstance.executeQuery(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stores,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_stores,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_stores,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_stores,
        COUNT(DISTINCT city) as total_cities,
        COUNT(DISTINCT country) as total_countries
      FROM stores
    `);

    return stats[0];
  }

  // Check if store has related data
  async checkStoreRelatedData(storeId) {
    try {
      // Check various collections for related data using Mongoose models (Commission table removed)
      const Sales = require('../models/Sale');
      const Purchases = require('../models/Purchase');
      const Campaigns = require('../models/Campaign');

      // Create model instances to access the Mongoose models
      const salesModel = new Sales();
      const purchasesModel = new Purchases();
      const campaignsModel = new Campaigns();

      const salesCount = await salesModel.model.countDocuments({ store_id: storeId });
      const purchasesCount = await purchasesModel.model.countDocuments({ store_id: storeId });
      const campaignsCount = await campaignsModel.model.countDocuments({ store_id: storeId });

      return salesCount > 0 || purchasesCount > 0 || campaignsCount > 0;
    } catch (error) {
      console.error('Error checking store related data:', error);
      // If there's an error checking, allow deletion to proceed
      return false;
    }
  }

  // Search stores
  async searchStores(searchTerm, limit = 10) {
    const query = `
      SELECT id, name, address, city, country, phone, status
      FROM stores 
      WHERE name LIKE ? OR address LIKE ? OR city LIKE ? OR country LIKE ?
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const storeInstance = new Store();
    return await storeInstance.executeQuery(query, [searchPattern, searchPattern, searchPattern, searchPattern, limit]);
  }

  // Get stores by city
  async getStoresByCity(city) {
    return await storeModel.findAll({ city });
  }

  // Get stores by country
  async getStoresByCountry(country) {
    return await storeModel.findAll({ country });
  }

  // Get stores overview statistics
  async getStoresOverviewStats() {
    try {
      const storeModel = new Store();
      
      // Get comprehensive store statistics
      const stats = await storeModel.executeQuery(`
        SELECT 
          COUNT(*) as total_stores,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stores,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_stores,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_stores,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_stores,
          COUNT(DISTINCT city) as unique_cities,
          COUNT(DISTINCT country) as unique_countries,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_stores_today,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as new_stores_week,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_stores_month
        FROM stores
      `);

      return stats[0] || {};
    } catch (error) {
      console.error('Get stores overview stats error:', error);
      throw error;
    }
  }
}

module.exports = new StoreController(); 