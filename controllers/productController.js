const { Product } = require('../models');

class ProductController {
  // Get all products with pagination and filters
  async getAllProducts(req) {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'name', 'price', 'stock_quantity', 'category', 'status', 'created_at'];
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
      whereConditions.push('(name LIKE ? OR description LIKE ? OR sku LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build MongoDB query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;
    if (min_price) query.price = { $gte: parseFloat(min_price) };
    if (max_price) query.price = { ...query.price, $lte: parseFloat(max_price) };

    // Get total count
    const total = await Product.count(query);

    // Get products with pagination
    const products = await Product.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(offset);

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get product by ID
  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  // Create new product
  async createProduct(productData) {
    // Check if SKU already exists
    if (productData.sku) {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }
    }

    return await Product.create(productData);
  }

  // Update product
  async updateProduct(id, productData) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if SKU is being changed and if it already exists
    if (productData.sku && productData.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }
    }

    return await Product.updateById(id, productData);
  }

  // Delete product
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product has any related data
    const hasRelatedData = await this.checkProductRelatedData(id);
    if (hasRelatedData) {
      throw new Error('Cannot delete product with related data');
    }

    return await Product.deleteById(id);
  }

  // Update product status
  async updateProductStatus(id, status) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const validStatuses = ['active', 'inactive', 'discontinued', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return await Product.updateById(id, { status });
  }

  // Update stock quantity
  async updateStockQuantity(id, quantity) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    return await Product.updateById(id, { stock_quantity: quantity });
  }

  // Get product statistics
  async getProductStats() {
    const productInstance = new Product();
    const stats = await productInstance.executeQuery(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products,
        COUNT(CASE WHEN status = 'discontinued' THEN 1 END) as discontinued_products,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock_quantity < 10 THEN 1 END) as low_stock,
        AVG(price) as avg_price,
        SUM(stock_quantity) as total_stock,
        COUNT(DISTINCT category) as total_categories
      FROM products
    `);

    return stats[0];
  }

  // Check if product has related data
  async checkProductRelatedData(productId) {
    // Check various tables for related data
    const tables = ['sales', 'purchases', 'online_purchases'];
    let hasData = false;

    const productInstance = new Product();
    for (const table of tables) {
      const result = await productInstance.executeQuery(
        `SELECT COUNT(*) as count FROM ${table} WHERE product_id = ?`,
        [productId]
      );
      if (result[0].count > 0) {
        hasData = true;
        break;
      }
    }

    return hasData;
  }

  // Search products
  async searchProducts(searchTerm, limit = 10) {
    const productInstance = new Product();
    const query = `
      SELECT id, name, sku, category, price, stock_quantity, status
      FROM products 
      WHERE name LIKE ? OR description LIKE ? OR sku LIKE ? OR category LIKE ?
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await productInstance.executeQuery(query, [searchPattern, searchPattern, searchPattern, searchPattern, limit]);
  }

  // Get products by category
  async getProductsByCategory(category) {
    return await Product.findAll({ category });
  }

  // Get low stock products
  async getLowStockProducts(threshold = 10) {
    const productInstance = new Product();
    return await productInstance.executeQuery(
      'SELECT * FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC',
      [threshold]
    );
  }
}

module.exports = new ProductController(); 