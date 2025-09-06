const BaseModel = require('./BaseModel');
const RefreshTokenSchema = require('../schemas/RefreshToken');

class RefreshToken extends BaseModel {
  constructor() {
    super(RefreshTokenSchema);
  }

  async findByToken(token) {
    return await RefreshTokenSchema.findOne({ token });
  }

  async findByUser(userId) {
    return await RefreshTokenSchema.find({ user: userId });
  }

  async findValid() {
    return await RefreshTokenSchema.find({ 
      is_revoked: false,
      expires_at: { $gt: new Date() }
    });
  }
}

module.exports = RefreshToken; 