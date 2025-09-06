const BaseModel = require('./BaseModel');
const OnlinePurchaseItemSchema = require('../schemas/OnlinePurchaseItem');

class OnlinePurchaseItem extends BaseModel {
  constructor() {
    super(OnlinePurchaseItemSchema);
  }

  async findByPurchase(purchaseId) {
    return await OnlinePurchaseItemSchema.find({ purchase: purchaseId });
  }

  async findByProduct(productId) {
    return await OnlinePurchaseItemSchema.find({ product: productId });
  }
}

module.exports = OnlinePurchaseItem; 