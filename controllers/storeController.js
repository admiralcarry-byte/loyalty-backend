const Store = require('../models/Store');

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
        sort: { createdAt: -1 },
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
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'name', 'city', 'country', 'status', 'created_at'];
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
    const total = await Store.count(query);

    // Get stores with pagination
    const stores = await Store.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(offset);

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
    const store = await Store.findById(id);
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
    // Check if store name already exists in the same city
    const existingStore = await Store.findOne({
      name: storeData.name,
      city: storeData.city
    });

    if (existingStore) {
      throw new Error('Store with this name already exists in this city');
    }

    return await Store.create(storeData);
  }

  // Update store
  async updateStore(id, storeData) {
    const store = await Store.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    // Check if store name is being changed and if it already exists
    if (storeData.name && storeData.name !== store.name) {
      const existingStore = await Store.findOne({
        name: storeData.name,
        city: storeData.city || store.city
      });
      if (existingStore) {
        throw new Error('Store with this name already exists in this city');
      }
    }

    return await Store.updateById(id, storeData);
  }

  // Delete store
  async deleteStore(id) {
    const store = await Store.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    // Check if store has any related data
    const hasRelatedData = await this.checkStoreRelatedData(id);
    if (hasRelatedData) {
      throw new Error('Cannot delete store with related data');
    }

    return await Store.deleteById(id);
  }

  // Update store status
  async updateStoreStatus(id, status) {
    const store = await Store.findById(id);
    if (!store) {
      throw new Error('Store not found');
    }

    const validStatuses = ['active', 'inactive', 'maintenance', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return await Store.updateById(id, { status });
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
    // Check various tables for related data
    const tables = ['sales', 'purchases', 'commissions', 'campaigns'];
    let hasData = false;

    const storeInstance = new Store();
    for (const table of tables) {
      const result = await storeInstance.executeQuery(
        `SELECT COUNT(*) as count FROM ${table} WHERE store_id = ?`,
        [storeId]
      );
      if (result[0].count > 0) {
        hasData = true;
        break;
      }
    }

    return hasData;
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
    return await Store.findAll({ city });
  }

  // Get stores by country
  async getStoresByCountry(country) {
    return await Store.findAll({ country });
  }
}

module.exports = new StoreController(); 