const BaseModel = require('./BaseModel');
const StoreSchema = require('../schemas/Store');

class Store extends BaseModel {
  constructor() {
    super(StoreSchema);
  }

  // Find active stores
  async findActive() {
    return await this.findAll({ status: 'active' });
  }

  // Find stores by status
  async findByStatus(status) {
    return await this.findAll({ status });
  }

  // Find stores by city
  async findByCity(city) {
    return await this.findAll({ city });
  }

  // Find stores by state
  async findByState(state) {
    return await this.findAll({ state });
  }

  // Search stores by name or address
  async searchStores(searchTerm) {
    const query = `
      SELECT * FROM stores 
      WHERE name LIKE ? OR address LIKE ? OR city LIKE ?
      ORDER BY name ASC
    `;
    const searchPattern = `%${searchTerm}%`;
    return await this.executeQuery(query, [searchPattern, searchPattern, searchPattern]);
  }

  // Find stores near a location (within radius)
  async findNearby(latitude, longitude, radiusKm = 10) {
    const query = `
      SELECT *, 
             (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
              cos(radians(longitude) - radians(?)) + 
              sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM stores 
      WHERE status = 'active'
      HAVING distance <= ?
      ORDER BY distance ASC
    `;
    return await this.executeQuery(query, [latitude, longitude, latitude, radiusKm]);
  }

  // Get store statistics
  async getStoreStats() {
    const query = `
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stores,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_stores,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_stores,
        COUNT(DISTINCT city) as total_cities,
        COUNT(DISTINCT state) as total_states
      FROM stores
    `;
    return await this.executeQuery(query);
  }

  // Get stores by performance (sales)
  async getStoresByPerformance(limit = 10) {
    const query = `
      SELECT 
        s.*,
        COALESCE(COUNT(sa.id), 0) as total_sales,
        COALESCE(SUM(sa.total_amount), 0) as total_revenue,
        COALESCE(SUM(sa.liters_sold), 0) as total_liters,
        COALESCE(AVG(sa.total_amount), 0) as average_sale
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY total_revenue DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [limit]);
  }

  // Get stores by city with performance
  async getStoresByCityWithPerformance() {
    const query = `
      SELECT 
        s.city,
        COUNT(s.id) as store_count,
        COALESCE(SUM(sa.total_amount), 0) as total_revenue,
        COALESCE(COUNT(sa.id), 0) as total_sales
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id
      WHERE s.status = 'active'
      GROUP BY s.city
      ORDER BY total_revenue DESC
    `;
    return await this.executeQuery(query);
  }

  // Get store details with sales information
  async getStoreWithSales(storeId) {
    const query = `
      SELECT 
        s.*,
        COALESCE(COUNT(sa.id), 0) as total_sales,
        COALESCE(SUM(sa.total_amount), 0) as total_revenue,
        COALESCE(SUM(sa.liters_sold), 0) as total_liters,
        COALESCE(AVG(sa.total_amount), 0) as average_sale,
        COALESCE(COUNT(DISTINCT sa.user_id), 0) as unique_customers
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id
      WHERE s.id = ?
      GROUP BY s.id
    `;
    const results = await this.executeQuery(query, [storeId]);
    return results.length > 0 ? results[0] : null;
  }

  // Get stores created in date range
  async getStoresByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM stores 
      WHERE DATE(created_at) BETWEEN ? AND ?
      ORDER BY created_at DESC
    `;
    return await this.executeQuery(query, [startDate, endDate]);
  }

  // Get stores by country
  async findByCountry(country) {
    return await this.findAll({ country });
  }

  // Get stores with contact information
  async getStoresWithContact() {
    const query = `
      SELECT id, name, address, city, state, phone, email, status
      FROM stores
      WHERE phone IS NOT NULL OR email IS NOT NULL
      ORDER BY name ASC
    `;
    return await this.executeQuery(query);
  }

  // Update store status
  async updateStatus(storeId, status) {
    return await this.updateById(storeId, { status });
  }

  // Get stores needing maintenance
  async getStoresNeedingMaintenance() {
    return await this.findAll({ status: 'maintenance' });
  }

  // Get store performance over time
  async getStorePerformanceOverTime(storeId, startDate, endDate) {
    const query = `
      SELECT 
        DATE(sa.created_at) as sale_date,
        COUNT(sa.id) as daily_sales,
        SUM(sa.total_amount) as daily_revenue,
        SUM(sa.liters_sold) as daily_liters,
        COUNT(DISTINCT sa.user_id) as daily_customers
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id
      WHERE s.id = ? AND DATE(sa.created_at) BETWEEN ? AND ?
      GROUP BY DATE(sa.created_at)
      ORDER BY sale_date ASC
    `;
    return await this.executeQuery(query, [storeId, startDate, endDate]);
  }

  // Get top performing stores by month
  async getTopStoresByMonth(year, month, limit = 10) {
    const query = `
      SELECT 
        s.id, s.name, s.city, s.state,
        COUNT(sa.id) as monthly_sales,
        SUM(sa.total_amount) as monthly_revenue,
        SUM(sa.liters_sold) as monthly_liters
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id
      WHERE s.status = 'active' 
        AND YEAR(sa.created_at) = ? 
        AND MONTH(sa.created_at) = ?
      GROUP BY s.id
      ORDER BY monthly_revenue DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [year, month, limit]);
  }

  // Get store distribution by state
  async getStoreDistributionByState() {
    const query = `
      SELECT 
        state,
        COUNT(*) as store_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stores
      FROM stores
      GROUP BY state
      ORDER BY store_count DESC
    `;
    return await this.executeQuery(query);
  }

  // Get store distribution by city
  async getStoreDistributionByCity() {
    const query = `
      SELECT 
        city,
        state,
        COUNT(*) as store_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stores
      FROM stores
      GROUP BY city, state
      ORDER BY store_count DESC
    `;
    return await this.executeQuery(query);
  }
}

module.exports = Store; 