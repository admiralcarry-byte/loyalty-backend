const BaseModel = require('./BaseModel');
const ProductSchema = require('../schemas/Product');

class Product extends BaseModel {
  constructor() {
    super(ProductSchema);
  }

  // Find product by SKU
  async findBySKU(sku) {
    return await ProductSchema.findBySKU(sku);
  }

  // Find active products
  async findActive() {
    return await ProductSchema.findActive();
  }

  // Find products by category
  async findByCategory(category) {
    return await ProductSchema.findByCategory(category);
  }

  // Find products by type
  async findByType(type) {
    return await ProductSchema.findByType(type);
  }

  // Find low stock products
  async findLowStock() {
    return await ProductSchema.findLowStock();
  }

  // Search products
  async search(searchTerm, options = {}) {
    return await ProductSchema.search(searchTerm, options);
  }

  // Update inventory quantity
  async updateInventory(productId, quantity, operation = 'set') {
    const product = await this.findById(productId);
    if (!product) throw new Error('Product not found');

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.inventory.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.inventory.quantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = Math.max(0, quantity);
        break;
    }

    return await this.updateById(productId, {
      'inventory.quantity': newQuantity
    });
  }

  // Reserve inventory
  async reserveInventory(productId, quantity) {
    const product = await this.findById(productId);
    if (!product) throw new Error('Product not found');

    const availableQuantity = product.inventory.quantity - product.inventory.reserved;
    if (availableQuantity < quantity) {
      throw new Error('Insufficient available inventory');
    }

    return await this.updateById(productId, {
      'inventory.reserved': product.inventory.reserved + quantity
    });
  }

  // Release reserved inventory
  async releaseReservedInventory(productId, quantity) {
    const product = await this.findById(productId);
    if (!product) throw new Error('Product not found');

    const newReserved = Math.max(0, product.inventory.reserved - quantity);
    return await this.updateById(productId, {
      'inventory.reserved': newReserved
    });
  }

  // Get products by price range
  async findByPriceRange(minPrice, maxPrice) {
    const query = { status: 'active' };
    
    if (minPrice !== undefined) {
      query['price.current'] = { $gte: minPrice };
    }
    
    if (maxPrice !== undefined) {
      query['price.current'] = { ...query['price.current'], $lte: maxPrice };
    }

    return await this.findAll(query, {
      sort: { 'price.current': 1 }
    });
  }

  // Get top rated products
  async getTopRated(limit = 10) {
    return await this.findAll({
      status: 'active',
      review_count: { $gte: 1 }
    }, {
      sort: { average_rating: -1 },
      limit
    });
  }

  // Get products by availability
  async findByAvailability(availabilityType) {
    const query = { status: 'active' };
    
    switch (availabilityType) {
      case 'in_stores':
        query['availability.in_stores'] = true;
        break;
      case 'online':
        query['availability.online'] = true;
        break;
      case 'delivery':
        query['availability.delivery'] = true;
        break;
      case 'pickup':
        query['availability.pickup'] = true;
        break;
    }

    return await this.findAll(query);
  }

  // Get products with discounts
  async findWithDiscounts() {
    return await this.findAll({
      status: 'active',
      'price.original': { $exists: true, $gt: 0 },
      $expr: { $gt: ['$price.original', '$price.current'] }
    }, {
      sort: { 'price.original': -1 }
    });
  }

  // Get products by water properties
  async findByWaterProperties(properties = {}) {
    const query = { status: 'active' };
    
    if (properties.ph_level) {
      query['water_properties.ph_level'] = properties.ph_level;
    }
    
    if (properties.tds) {
      query['water_properties.tds'] = properties.tds;
    }
    
    if (properties.source) {
      query['water_properties.source'] = new RegExp(properties.source, 'i');
    }

    return await this.findAll(query);
  }

  // Get product statistics
  async getProductStats() {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          total_products: { $sum: 1 },
          active_products: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          out_of_stock: { $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] } },
          low_stock: { $sum: { $cond: [{ $lte: ['$inventory.quantity', '$inventory.reorder_point'] }, 1, 0] } },
          total_value: { $sum: { $multiply: ['$price.current', '$inventory.quantity'] } },
          average_price: { $avg: '$price.current' },
          total_reviews: { $sum: '$review_count' },
          average_rating: { $avg: '$average_rating' }
        }
      }
    ]);

    return stats[0] || {
      total_products: 0,
      active_products: 0,
      out_of_stock: 0,
      low_stock: 0,
      total_value: 0,
      average_price: 0,
      total_reviews: 0,
      average_rating: 0
    };
  }
}

module.exports = Product; 