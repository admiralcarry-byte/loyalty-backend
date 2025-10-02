# Railway Deployment Guide

This guide explains how to deploy the ÁGUA TWEZAH backend to Railway and troubleshoot common issues.

## 🚀 Quick Deployment

### 1. Railway Configuration

The project includes a `railway.json` configuration file with:

```json
{
  "deploy": {
    "startCommand": "npm run start:production",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 2. Environment Variables

Set these environment variables in Railway:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://admiralcarry_db_user:hRbz6MRdicUoyLZk@loyalty-cloud.k62anvl.mongodb.net/aguatwezah_admin
JWT_SECRET=aguatwezah_production_secret_key_2024_secure
JWT_REFRESH_SECRET=aguatwezah_production_refresh_secret_key_2024_secure
CORS_ORIGIN=https://loyalty-frontend.netlify.app,https://loyalty-admin.netlify.app
RAILWAY_ENVIRONMENT=production
```

## 🔧 Available Startup Scripts

### 1. `npm run start:production` (Recommended)
- Full production server with all routes
- Proper error handling and logging
- Database connection with retry logic
- Used by Railway deployment

### 2. `npm run start:minimal` (Fallback)
- Minimal server with essential routes only
- Faster startup for debugging
- Non-blocking database connection
- Health check available immediately

### 3. `npm start` (Default)
- Standard server.js startup
- Full feature set
- Used for local development

## 🏥 Health Check Endpoints

### Primary Health Check
```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "OK",
  "message": "ÁGUA TWEZAH Admin Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "database": {
    "type": "MongoDB",
    "status": "connected",
    "readyState": 1
  },
  "uptime": 123.45,
  "version": "1.0.0",
  "apiVersion": "v1"
}
```

### CORS Test
```
GET /api/cors-test
```

## 🧪 Testing Deployment

### 1. Test Railway Health
```bash
cd backend
npm run test-railway
```

### 2. Test CORS Configuration
```bash
cd backend
npm run test-cors
```

### 3. Manual Testing
```bash
# Test health endpoint
curl https://loyalty-backend-production-8e32.up.railway.app/api/health

# Test CORS
curl -H "Origin: https://loyalty-frontend.netlify.app" \
     https://loyalty-backend-production-8e32.up.railway.app/api/cors-test
```

## 🐛 Troubleshooting

### Issue: "Healthcheck failed! 1/1 replicas never became healthy!"

**Causes:**
1. Server startup takes too long
2. Database connection fails
3. Health check endpoint not responding
4. Port configuration issues

**Solutions:**

1. **Check Railway Logs:**
   ```bash
   railway logs --follow
   ```

2. **Verify Environment Variables:**
   - Ensure `MONGODB_URI` is correct
   - Check `NODE_ENV=production`
   - Verify `CORS_ORIGIN` is set

3. **Test Database Connection:**
   ```bash
   # Test MongoDB connection string
   mongosh "mongodb+srv://admiralcarry_db_user:hRbz6MRdicUoyLZk@loyalty-cloud.k62anvl.mongodb.net/aguatwezah_admin"
   ```

4. **Use Minimal Startup:**
   Update `railway.json`:
   ```json
   {
     "deploy": {
       "startCommand": "npm run start:minimal"
     }
   }
   ```

### Issue: "Service unavailable" errors

**Solutions:**

1. **Increase Health Check Timeout:**
   ```json
   {
     "deploy": {
       "healthcheckTimeout": 300
     }
   }
   ```

2. **Check Resource Limits:**
   - Railway free tier has memory/CPU limits
   - Consider upgrading if hitting limits

3. **Optimize Startup:**
   - Use `start:minimal` for faster startup
   - Remove heavy initialization code

### Issue: Database Connection Fails

**Solutions:**

1. **Verify Atlas Network Access:**
   - Add Railway IP ranges to Atlas whitelist
   - Or use `0.0.0.0/0` for all IPs (less secure)

2. **Check Connection String:**
   ```bash
   # Test connection
   mongosh "mongodb+srv://admiralcarry_db_user:hRbz6MRdicUoyLZk@loyalty-cloud.k62anvl.mongodb.net/aguatwezah_admin"
   ```

3. **Database User Permissions:**
   - Ensure user has read/write access
   - Check database name is correct

### Issue: CORS Errors

**Solutions:**

1. **Update CORS_ORIGIN:**
   ```bash
   CORS_ORIGIN=https://loyalty-frontend.netlify.app,https://loyalty-admin.netlify.app
   ```

2. **Test CORS Configuration:**
   ```bash
   npm run test-cors
   ```

## 📊 Monitoring

### Railway Dashboard
- Monitor deployment status
- Check logs and metrics
- View environment variables

### Health Check Monitoring
```bash
# Set up monitoring script
#!/bin/bash
while true; do
  curl -f https://loyalty-backend-production-8e32.up.railway.app/api/health || echo "Health check failed"
  sleep 60
done
```

## 🔄 Deployment Process

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Fix Railway deployment"
   git push
   ```

2. **Railway Auto-Deploy:**
   - Railway automatically deploys on git push
   - Monitor deployment in Railway dashboard

3. **Verify Deployment:**
   ```bash
   npm run test-railway
   ```

4. **Test Frontend Connection:**
   - Deploy frontend to Netlify
   - Test API calls from frontend

## 📝 Deployment Checklist

- [ ] Environment variables set in Railway
- [ ] MongoDB Atlas network access configured
- [ ] CORS_ORIGIN includes frontend URLs
- [ ] Health check endpoint responding
- [ ] Database connection successful
- [ ] Frontend can connect to backend
- [ ] All API endpoints working
- [ ] Logs show no errors

## 🆘 Support

If deployment issues persist:

1. Check Railway logs for specific errors
2. Test database connection manually
3. Verify environment variables
4. Try minimal startup script
5. Check Railway status page for outages

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)