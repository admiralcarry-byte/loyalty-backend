# Railway Deployment Guide

## Issues Fixed

1. **✅ Syntax Error Fixed**: Removed stray semicolon in `middleware/errorHandler.js`
2. **✅ Server Startup**: Backend now starts successfully locally

## Railway Deployment Steps

### 1. Environment Variables Required

Set these environment variables in your Railway project:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb+srv://admiralcarry_db_user:hRbz6MRdicUoyLZk@loyalty-cloud.k62anvl.mongodb.net/aguatwezah_admin

# JWT Configuration
JWT_SECRET=aguatwezah-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRE=7d

# API Configuration
API_PREFIX=/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS Configuration (update with your frontend URL)
CORS_ORIGIN=https://your-frontend-domain.com

# Business Configuration
DEFAULT_CURRENCY=USD
DEFAULT_TIMEZONE=Africa/Luanda
DEFAULT_LANGUAGE=Portuguese

# Points Configuration
POINTS_PER_DOLLAR=10
POINTS_EXPIRY_DAYS=365
CASHBACK_DEFAULT_PERCENTAGE=5

# Commission Configuration
DEFAULT_COMMISSION_RATE=5
INFLUENCER_COMMISSION_RATE=10
```

### 2. Railway Configuration Files

- `railway.json`: Railway deployment configuration (uses Dockerfile)
- `Dockerfile`: Docker configuration for Railway deployment
- `.dockerignore`: Optimizes Docker build by excluding unnecessary files

### 3. Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Railway
2. **Set Environment Variables**: Add all the environment variables listed above
3. **Deploy**: Railway will automatically deploy using Dockerfile (more reliable than Nixpacks)
4. **Monitor Build**: Check the build logs for any issues

### 4. Database Setup

If you want to use Railway's MongoDB service instead:

1. Add MongoDB service to your Railway project
2. Update `MONGODB_URI` to use Railway's MongoDB connection string
3. Run database migrations: `npm run migrate`

### 5. Health Check

After deployment, test these endpoints:

- Health Check: `https://your-app.railway.app/api/health`
- CORS Test: `https://your-app.railway.app/api/cors-test`

### 6. Common Issues and Solutions

#### Port Issues
- Railway automatically assigns `PORT` environment variable
- The server code already handles this correctly

#### Database Connection
- Ensure `MONGODB_URI` is correctly set
- Check if your MongoDB Atlas cluster allows connections from Railway's IP ranges

#### CORS Issues
- Update `CORS_ORIGIN` to match your frontend domain
- The server already includes common development domains

#### File Upload Issues
- Railway has ephemeral file system
- Consider using cloud storage (AWS S3, Cloudinary) for file uploads

### 7. Monitoring

Check Railway logs for:
- Database connection errors
- Port binding issues
- Environment variable problems
- Application startup errors

### 8. Next Steps After Deployment

1. **Seed Database**: Run `npm run seed` to populate initial data
2. **Test API Endpoints**: Verify all endpoints are working
3. **Update Frontend**: Point your frontend to the new Railway URL
4. **Set up Monitoring**: Configure logging and error tracking