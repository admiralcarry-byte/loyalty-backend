class BaseModel {
  constructor(model) {
    this.model = model;
  }

  // Find all records with optional conditions
  async findAll(conditions = {}, options = {}) {
    try {
      let query = this.model.find(conditions);
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      return await query.exec();
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  // Find one record by ID
  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  // Find one record by conditions
  async findOne(conditions) {
    try {
      return await this.model.findOne(conditions);
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  // Create a new record
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  // Update a record by ID
  async updateById(id, data) {
    try {
      return await this.model.findByIdAndUpdate(
        id, 
        data, 
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error('Error in updateById:', error);
      throw error;
    }
  }

  // Update records by conditions
  async update(conditions, data) {
    try {
      return await this.model.updateMany(conditions, data, { runValidators: true });
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  // Delete a record by ID
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error in deleteById:', error);
      throw error;
    }
  }

  // Delete records by conditions
  async delete(conditions) {
    try {
      return await this.model.deleteMany(conditions);
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Count records with optional conditions
  async count(conditions = {}) {
    try {
      return await this.model.countDocuments(conditions);
    } catch (error) {
      console.error('Error in count:', error);
      throw error;
    }
  }

  // Pagination helper
  async paginate(page = 1, limit = 10, conditions = {}, options = {}) {
    try {
      const skip = (page - 1) * limit;
      const data = await this.findAll(conditions, { ...options, skip, limit });
      const total = await this.count(conditions);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in paginate:', error);
      throw error;
    }
  }

  // Aggregate pipeline
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      console.error('Error in aggregate:', error);
      throw error;
    }
  }

  // Find and update one
  async findOneAndUpdate(conditions, update, options = {}) {
    try {
      return await this.model.findOneAndUpdate(
        conditions, 
        update, 
        { new: true, runValidators: true, ...options }
      );
    } catch (error) {
      console.error('Error in findOneAndUpdate:', error);
      throw error;
    }
  }

  // Find and delete one
  async findOneAndDelete(conditions) {
    try {
      return await this.model.findOneAndDelete(conditions);
    } catch (error) {
      console.error('Error in findOneAndDelete:', error);
      throw error;
    }
  }
}

module.exports = BaseModel; 