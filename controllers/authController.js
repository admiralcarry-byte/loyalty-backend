const { User } = require('../models');
const userModel = new User();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class AuthController {
  // User registration
  async register(userData) {
    // Validation should be handled in the route middleware
    // This method assumes data is already validated

    // Check if email already exists
    const existingUser = await userModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Check if phone already exists
    if (userData.phone) {
      const existingPhone = await userModel.findOne({ phone: userData.phone });
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }
    }

    // Create user
    const user = await userModel.createUser(userData);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        loyalty_tier: user.loyalty_tier,
        status: user.status
      },
      accessToken: token,
      refreshToken: token // For now, using the same token as refresh token
    };
  }

  // User login
  async login(email, password) {
    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userModel.updateById(user.id, { last_login: new Date() });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        loyalty_tier: user.loyalty_tier,
        status: user.status,
        points_balance: user.points_balance,
        total_liters: user.total_liters
      },
      accessToken: token,
      refreshToken: token // For now, using the same token as refresh token
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'aguatwezah_refresh_secret_key_2024';
      const decoded = jwt.verify(refreshToken, refreshSecret);
      const user = await userModel.findById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        throw new Error('Invalid refresh token');
      }

      const newToken = this.generateToken(user);
      return { token: newToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await userModel.updateById(userId, { password_hash: newPasswordHash });

    return { message: 'Password changed successfully' };
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = this.generateResetToken(user.id);
    
    // Store reset token in database (you might want to add a reset_token field to users table)
    await userModel.updateById(user.id, { 
      reset_token: resetToken,
      reset_token_expires: new Date(Date.now() + 3600000) // 1 hour
    });

    // TODO: Send email with reset link
    // This would integrate with your email service

    return { message: 'Password reset instructions sent to your email' };
  }

  // Reset password
  async resetPassword(resetToken, newPassword) {
    // Find user by reset token
    const user = await userModel.findOne({ reset_token: resetToken });
    if (!user) {
      throw new Error('Invalid reset token');
    }

    // Check if token is expired
    if (new Date() > new Date(user.reset_token_expires)) {
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await userModel.updateById(user.id, { 
      password_hash: newPasswordHash,
      reset_token: null,
      reset_token_expires: null
    });

    return { message: 'Password reset successfully' };
  }

  // Verify email
  async verifyEmail(token) {
    // Find user by verification token
    const user = await userModel.findOne({ email_verification_token: token });
    if (!user) {
      throw new Error('Invalid verification token');
    }

    // Update user as verified
    await userModel.updateById(user.id, { 
      email_verified: true,
      email_verification_token: null
    });

    return { message: 'Email verified successfully' };
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken(user.id);
    
    await userModel.updateById(user.id, { 
      email_verification_token: verificationToken
    });

    // TODO: Send verification email
    // This would integrate with your email service

    return { message: 'Verification email sent' };
  }

  // Logout (invalidate token)
  async logout(userId) {
    // In a more sophisticated system, you might want to blacklist the token
    // For now, we'll just return success
    return { message: 'Logged out successfully' };
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const jwtSecret = process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return jwt.sign(payload, jwtSecret, {
      expiresIn: jwtExpiresIn
    });
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'aguatwezah_refresh_secret_key_2024';
    return jwt.sign({ userId }, refreshSecret, {
      expiresIn: '7d'
    });
  }

  // Generate reset token
  generateResetToken(userId) {
    const jwtSecret = process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024';
    return jwt.sign({ userId, type: 'reset' }, jwtSecret, {
      expiresIn: '1h'
    });
  }

  // Generate verification token
  generateVerificationToken(userId) {
    const jwtSecret = process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024';
    return jwt.sign({ userId, type: 'verification' }, jwtSecret, {
      expiresIn: '24h'
    });
  }

  // Validate token
  validateToken(token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024';
      const decoded = jwt.verify(token, jwtSecret);
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get user profile
  async getProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      loyalty_tier: user.loyalty_tier,
      status: user.status,
      points_balance: user.points_balance,
      total_liters: user.total_liters,
      referral_code: user.referral_code,
      referred_by: user.referred_by,
      avatar_url: user.avatar_url,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      address: user.address,
      city: user.city,
      country: user.country,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    };
  }

  // Update profile
  async updateProfile(userId, profileData) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive fields that shouldn't be updated via profile
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'date_of_birth', 
      'gender', 'address', 'city', 'country', 'avatar_url'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        filteredData[field] = profileData[field];
      }
    }

    return await userModel.updateById(userId, filteredData);
  }
}

module.exports = new AuthController(); 