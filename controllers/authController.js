const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class AuthController {
  constructor() {
    this.userModel = new User();
  }
  // User registration
  async register(userData) {
    // Validation should be handled in the route middleware
    // This method assumes data is already validated

    // Check if email already exists
    const existingUser = await this.userModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Check if phone already exists
    if (userData.phone) {
      const existingPhone = await this.userModel.findOne({ phone: userData.phone });
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }
    }

    // Create user
    const user = await this.userModel.createUser(userData);

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

  // Check if admin registration is enabled (no admin exists)
  async isAdminRegistrationEnabled() {
    try {
      const existingAdmin = await this.userModel.findOne({ role: 'admin' });
      return !existingAdmin; // Return true if no admin exists, false otherwise
    } catch (error) {
      console.error('Error checking admin registration status:', error);
      return false;
    }
  }

  // Admin registration
  async registerAdmin(userData) {
    // Check if admin registration is enabled (only one admin allowed)
    const registrationEnabled = await this.isAdminRegistrationEnabled();
    if (!registrationEnabled) {
      throw new Error('Admin registration is disabled. An administrator already exists on this platform.');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Check if phone already exists
    if (userData.phone) {
      const existingPhone = await this.userModel.findOne({ phone: userData.phone });
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }
    }

    // Generate username from email (take part before @)
    let username = userData.email.split('@')[0];
    
    // Check if username already exists, if so append a number
    let usernameExists = await this.userModel.findOne({ username });
    let counter = 1;
    while (usernameExists) {
      username = `${userData.email.split('@')[0]}${counter}`;
      usernameExists = await this.userModel.findOne({ username });
      counter++;
    }

    // Create admin user with role set to 'admin'
    const adminData = {
      ...userData,
      username,
      role: 'admin',
      status: 'active'
    };

    const user = await this.userModel.createUser(adminData);

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
  async login(email, password, influencerPhone = null) {
    // Find user by email
    const user = await this.userModel.findByEmail(email);
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

    // Check influencer phone validation
    if (user.referred_by_phone) {
      // User was referred by an influencer, so influencer phone is required
      if (!influencerPhone) {
        throw new Error('Influencer phone number is required for this account. Please enter the phone number of the influencer who referred you.');
      }
      
      // Validate that the provided influencer phone matches the stored one
      if (user.referred_by_phone !== influencerPhone) {
        throw new Error('The influencer phone number does not match our records. Please verify the number or contact support if you believe this is an error.');
      }
    } else {
      // User was not referred by an influencer, so influencer phone should not be provided
      if (influencerPhone) {
        throw new Error('This account was not referred by an influencer. Please leave the influencer phone number field blank.');
      }
    }

    // Update last login
    await this.userModel.updateById(user.id, { last_login: new Date() });

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
        total_liters: user.total_liters,
        referred_by_phone: user.referred_by_phone
      },
      accessToken: token,
      refreshToken: token // For now, using the same token as refresh token
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      // For now, we're using the same token as refresh token, so verify with main secret
      const jwtSecret = process.env.JWT_SECRET || 'aguatwezah_super_secret_jwt_key_2024';
      const decoded = jwt.verify(refreshToken, jwtSecret);
      const user = await this.userModel.findById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        throw new Error('Invalid refresh token');
      }

      const newToken = this.generateToken(user);
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
          total_liters: user.total_liters,
          referred_by_phone: user.referred_by_phone
        },
        accessToken: newToken 
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userModel.findById(userId);
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
    await this.userModel.updateById(userId, { password_hash: newPasswordHash });

    return { message: 'Password changed successfully' };
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = this.generateResetToken(user.id);
    
    // Store reset token in database (you might want to add a reset_token field to users table)
    await this.userModel.updateById(user.id, { 
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
    const user = await this.userModel.findOne({ reset_token: resetToken });
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
    await this.userModel.updateById(user.id, { 
      password_hash: newPasswordHash,
      reset_token: null,
      reset_token_expires: null
    });

    return { message: 'Password reset successfully' };
  }

  // Verify email
  async verifyEmail(token) {
    // Find user by verification token
    const user = await this.userModel.findOne({ email_verification_token: token });
    if (!user) {
      throw new Error('Invalid verification token');
    }

    // Update user as verified
    await this.userModel.updateById(user.id, { 
      email_verified: true,
      email_verification_token: null
    });

    return { message: 'Email verified successfully' };
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken(user.id);
    
    await this.userModel.updateById(user.id, { 
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
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

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
    const user = await this.userModel.findById(userId);
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
      referred_by_phone: user.referred_by_phone,
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

    return await this.userModel.updateById(userId, filteredData);
  }
}

module.exports = new AuthController(); 