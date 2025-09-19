# Database Consistency Fix

## Problem Identified

When running `npm run seed`, only 6 collections are created:
- `commissions`
- `sales` 
- `stores`
- `users`
- `influencerlevels`
- `loyaltylevels`

But when running `npm run dev`, the server loads all routes which import all 25+ models, causing MongoDB to automatically create additional collections that weren't seeded.

## Root Cause

1. **Seeders** only create 6 collections (minimal set for active pages)
2. **Server** loads all routes which import all models from `models/index.js`
3. **Mongoose** automatically creates collections when models are imported
4. **Result**: Additional empty collections are created when server starts

## Solution Implemented

### 1. Fixed Database Name Mismatch
- ✅ Updated `backend/seeders/BaseSeeder.js` to use `aguatwezah_admin` instead of `loyalty_system`
- ✅ Updated `backend/scripts/seed.js` to use `aguatwezah_admin` instead of `loyalty_system`

### 2. Modified Seeding to Only Create Required Collections
- ✅ Updated `backend/scripts/seed.js` to only seed 6 essential collections
- ✅ Removed ProductSeeder from seeding process

### 3. Prevented Auto-Creation of Additional Collections
- ✅ Added `mongoose.set('autoCreate', false)` to prevent auto-creation
- ✅ Added `mongoose.set('autoIndex', false)` to prevent auto-indexing
- ✅ Applied to both database connection and seeding process

## Usage Instructions

### Standard Commands (Fixed)
```bash
# 1. Create .env file
node scripts/create-env.js

# 2. Seed only required collections
npm run seed

# 3. Start server (no additional collections created)
npm run dev
```

## Collections Created

### Seeding (`npm run seed`)
- `commissions` - Commission records
- `sales` - Sales transactions  
- `stores` - Store locations
- `users` - User accounts (including admin)
- `influencerlevels` - Influencer tier levels
- `loyaltylevels` - Customer loyalty levels

### Server (`npm run dev`)
- Uses the same 6 collections created by seeding
- No additional collections created due to `autoCreate: false`
- Perfect for testing admin login

## Admin Login Credentials
- **Email:** `admin@aguatwezah.com`
- **Password:** `admin123`

## Verification

To verify the fix works:

1. **Check collections after seeding:**
   ```bash
   # Connect to MongoDB and list collections
   # Should only see the 6 seeded collections
   ```

2. **Check collections after server start:**
   ```bash
   # With minimal server: should still only see 6 collections
   # With full server: will see 25+ collections
   ```

3. **Test admin login:**
   ```bash
   # Should work with both minimal and full server
   # Admin user is created in the 'users' collection
   ```

## Benefits

- ✅ **Consistent database state** - only seeded collections exist
- ✅ **Faster startup** - minimal server loads fewer routes
- ✅ **Easier debugging** - clear separation between seeded and auto-created collections
- ✅ **Flexible deployment** - choose minimal or full based on needs

## Files Modified

1. `backend/seeders/BaseSeeder.js` - Fixed database name + added autoCreate: false
2. `backend/scripts/seed.js` - Fixed database name + removed ProductSeeder + added autoCreate: false
3. `backend/config/database.js` - Added autoCreate: false and autoIndex: false
4. `backend/package.json` - Simplified scripts (removed minimal variants)
5. `backend/DATABASE_CONSISTENCY_FIX.md` - This documentation (created)