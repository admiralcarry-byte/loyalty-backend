# Database Schema Documentation

This document describes the updated database schema that aligns with the corrected API structure.

## Overview

The database schema has been redesigned to ensure consistency with the corrected API endpoints and improve performance through optimized indexing.

## Collections

### 1. Users Collection (`users`)

**Purpose**: Stores user account information and profiles.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `username`: String (Unique)
- `email`: String (Unique)
- `password_hash`: String
- `first_name`: String
- `last_name`: String
- `phone`: String
- `role`: Enum ['admin', 'manager', 'staff', 'user', 'customer', 'influencer']
- `status`: Enum ['active', 'inactive', 'suspended']
- `referral_code`: String (Unique, Sparse)
- `referred_by`: ObjectId (Reference to User)
- `loyalty_tier`: Enum ['lead', 'silver', 'gold', 'platinum']
- `points_balance`: Number
- `total_purchases`: Number
- `total_liters`: Number
- `last_login`: Date
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `email` (Unique)
- `username` (Unique)
- `referral_code` (Unique, Sparse)
- `role + status` (Compound)
- `loyalty_tier`
- `createdAt` (Descending)
- `last_login` (Descending)

### 2. Stores Collection (`stores`)

**Purpose**: Stores physical store locations and information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `name`: String
- `address`: String
- `city`: String
- `country`: String
- `phone`: String
- `email`: String
- `status`: Enum ['active', 'inactive', 'maintenance', 'closed']
- `latitude`: Number
- `longitude`: Number
- `location`: GeoJSON Point
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `name`
- `city + country` (Compound)
- `status`
- `location` (2dsphere)
- `createdAt` (Descending)

### 3. Products Collection (`products`)

**Purpose**: Stores product information and inventory.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `name`: String
- `sku`: String (Unique)
- `description`: String
- `category`: String
- `price`: Number
- `stock_quantity`: Number
- `status`: Enum ['active', 'inactive', 'discontinued']
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `name`
- `sku` (Unique)
- `category`
- `status`
- `stock_quantity`
- `createdAt` (Descending)

### 4. Sales Collection (`sales`)

**Purpose**: Stores sales transactions and order information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `sale_number`: String (Unique)
- `transaction_id`: String (Unique)
- `user_id`: ObjectId (Reference to User)
- `store_id`: ObjectId (Reference to Store)
- `product_id`: ObjectId (Reference to Product)
- `quantity`: Number
- `unit_price`: Number
- `total_amount`: Number
- `status`: Enum ['pending', 'processing', 'completed', 'cancelled', 'refunded']
- `points_earned`: Number
- `cashback_earned`: Number
- `payment_method`: Enum ['cash', 'mobile_money', 'bank_transfer', 'credit_card', 'debit_card', 'points']
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `sale_number` (Unique)
- `transaction_id` (Unique)
- `user_id + createdAt` (Compound, Descending)
- `store_id + createdAt` (Compound, Descending)
- `product_id + createdAt` (Compound, Descending)
- `status + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 5. Purchases Collection (`purchases`)

**Purpose**: Stores purchase entries (formerly PurchaseEntry).

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `purchase_number`: String (Unique)
- `user_id`: ObjectId (Reference to User)
- `store_id`: ObjectId (Reference to Store)
- `products`: Array of Product Objects
- `total_amount`: Number
- `total_liters`: Number
- `total_points`: Number
- `payment_method`: Enum ['cash', 'mobile_money', 'bank_transfer', 'credit_card', 'debit_card', 'points']
- `status`: Enum ['pending', 'completed', 'cancelled', 'refunded']
- `purchase_date`: Date
- `created_by`: ObjectId (Reference to User)
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `purchase_number` (Unique)
- `user_id + createdAt` (Compound, Descending)
- `store_id + createdAt` (Compound, Descending)
- `status + createdAt` (Compound, Descending)
- `purchase_date`
- `createdAt` (Descending)

### 6. Online Purchases Collection (`onlinepurchases`)

**Purpose**: Stores online order information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `order_number`: String (Unique)
- `user_id`: ObjectId (Reference to User)
- `items`: Array of Product Objects
- `total_amount`: Number
- `status`: Enum ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
- `payment_status`: Enum ['pending', 'paid', 'failed', 'refunded']
- `delivery_address`: Object
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `order_number` (Unique)
- `user_id + createdAt` (Compound, Descending)
- `status + createdAt` (Compound, Descending)
- `payment_status + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 7. Commissions Collection (`commissions`)

**Purpose**: Stores commission information for influencers.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `user_id`: ObjectId (Reference to User)
- `store_id`: ObjectId (Reference to Store)
- `sale_id`: ObjectId (Reference to Sale)
- `amount`: Number
- `rate`: Number
- `status`: Enum ['pending', 'approved', 'rejected', 'paid']
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `user_id + createdAt` (Compound, Descending)
- `store_id + createdAt` (Compound, Descending)
- `sale_id`
- `status + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 8. Notifications Collection (`notifications`)

**Purpose**: Stores notification information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `title`: String
- `message`: String
- `type`: Enum ['info', 'success', 'warning', 'error', 'promotion', 'system', 'transaction', 'referral']
- `category`: Enum ['general', 'points', 'sales', 'campaigns', 'referrals', 'security', 'billing', 'support']
- `priority`: Enum ['low', 'normal', 'high', 'urgent']
- `recipients`: Array of User Objects
- `status`: Enum ['draft', 'scheduled', 'sent', 'failed']
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `type + status` (Compound)
- `category + status` (Compound)
- `priority + status` (Compound)
- `status + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 9. Campaigns Collection (`campaigns`)

**Purpose**: Stores marketing campaign information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `name`: String
- `description`: String
- `type`: Enum ['promotional', 'seasonal', 'referral', 'loyalty', 'other']
- `status`: Enum ['draft', 'active', 'paused', 'completed', 'cancelled']
- `start_date`: Date
- `end_date`: Date
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `name`
- `type + status` (Compound)
- `start_date + end_date` (Compound)
- `status + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 10. Payout Requests Collection (`payoutrequests`)

**Purpose**: Stores payout request information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `user_id`: ObjectId (Reference to User)
- `amount`: Number
- `status`: Enum ['pending', 'approved', 'rejected', 'paid']
- `request_date`: Date
- `processed_date`: Date
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `user_id + createdAt` (Compound, Descending)
- `status + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 11. Points Transactions Collection (`pointstransactions`)

**Purpose**: Stores points transaction history.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `user_id`: ObjectId (Reference to User)
- `type`: Enum ['earned', 'spent', 'expired', 'adjusted']
- `amount`: Number
- `balance_after`: Number
- `reference_type`: String
- `reference_id`: ObjectId
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `user_id + createdAt` (Compound, Descending)
- `type + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 12. Cashback Transactions Collection (`cashbacktransactions`)

**Purpose**: Stores cashback transaction history.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `user_id`: ObjectId (Reference to User)
- `type`: Enum ['earned', 'redeemed', 'expired', 'adjusted']
- `amount`: Number
- `balance_after`: Number
- `reference_type`: String
- `reference_id`: ObjectId
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `user_id + createdAt` (Compound, Descending)
- `type + createdAt` (Compound, Descending)
- `createdAt` (Descending)

### 13. Audit Logs Collection (`auditlogs`)

**Purpose**: Stores audit trail information.

**Key Fields**:
- `_id`: ObjectId (Primary Key)
- `user_id`: ObjectId (Reference to User)
- `action`: String
- `table_name`: String
- `record_id`: ObjectId
- `old_values`: Object
- `new_values`: Object
- `ip_address`: String
- `user_agent`: String
- `createdAt`: Date
- `updatedAt`: Date

**Indexes**:
- `user_id + createdAt` (Compound, Descending)
- `action + createdAt` (Compound, Descending)
- `table_name + createdAt` (Compound, Descending)
- `createdAt` (Descending)

## Relationships

### Primary Relationships

1. **User → Sales**: One-to-Many
   - `sales.user_id` → `users._id`

2. **User → Purchases**: One-to-Many
   - `purchases.user_id` → `users._id`

3. **User → Online Purchases**: One-to-Many
   - `onlinepurchases.user_id` → `users._id`

4. **User → Commissions**: One-to-Many
   - `commissions.user_id` → `users._id`

5. **User → Payout Requests**: One-to-Many
   - `payoutrequests.user_id` → `users._id`

6. **User → Points Transactions**: One-to-Many
   - `pointstransactions.user_id` → `users._id`

7. **User → Cashback Transactions**: One-to-Many
   - `cashbacktransactions.user_id` → `users._id`

8. **User → Notifications**: One-to-Many (via recipients array)
   - `notifications.recipients.user_id` → `users._id`

9. **Store → Sales**: One-to-Many
   - `sales.store_id` → `stores._id`

10. **Store → Purchases**: One-to-Many
    - `purchases.store_id` → `stores._id`

11. **Product → Sales**: One-to-Many
    - `sales.product_id` → `products._id`

12. **Sale → Commission**: One-to-One
    - `commissions.sale_id` → `sales._id`

## Migration Notes

### Changes Made

1. **Collection Renaming**:
   - `purchaseentries` → `purchases`

2. **Field Standardization**:
   - `user` → `user_id`
   - `store` → `store_id`
   - `product` → `product_id`
   - `created_at` → `createdAt`
   - `updated_at` → `updatedAt`

3. **Schema Updates**:
   - Added missing static methods to schemas
   - Updated field names for consistency
   - Added optimized indexes

4. **Obsolete Collections Removed**:
   - `onlinepurchaseitems` (merged into `onlinepurchases`)

### Migration Scripts

1. **003_align_api_schema.js**: Aligns collections and field names
2. **004_update_existing_data.js**: Updates existing data to match new schema

### Performance Optimizations

1. **Compound Indexes**: Created for frequently queried field combinations
2. **Geospatial Indexes**: Added for location-based queries
3. **Unique Indexes**: Ensured for fields that must be unique
4. **Sparse Indexes**: Used for optional unique fields

## API Alignment

The database schema now perfectly aligns with the corrected API structure:

- All collection names match API endpoint paths
- Field names are consistent across all collections
- Relationships are properly defined
- Indexes are optimized for API query patterns
- Static methods support all API functionality

This ensures clean, efficient, and maintainable database operations that directly support the frontend API calls.