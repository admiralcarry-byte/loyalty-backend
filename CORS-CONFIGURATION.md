# CORS Configuration Guide

This document explains the CORS (Cross-Origin Resource Sharing) configuration for the ÁGUA TWEZAH loyalty system.

## Overview

The system is deployed across three platforms:
- **Database**: MongoDB Atlas (`mongodb+srv://admiralcarry_db_user:hRbz6MRdicUoyLZk@loyalty-cloud.k62anvl.mongodb.net/`)
- **Backend**: Railway (`https://loyalty-backend-production-8e32.up.railway.app`)
- **Frontend**: Netlify (`https://loyalty-frontend.netlify.app`)

## Current CORS Configuration

### Backend CORS Settings

The backend CORS configuration is located in `server.js` and includes:

**Allowed Origins:**
- `http://localhost:3000` (Local development)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8080` (Alternative local port)
- `http://localhost:8081` (Alternative local port)
- `https://loyalty-frontend.netlify.app` (Production frontend)
- `https://loyalty-admin.netlify.app` (Admin frontend)
- `https://loyalty-backend-production-8e32.up.railway.app` (Backend self-reference)

**Allowed Methods:**
- GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-Requested-With, Accept, Origin

**Credentials:** Enabled

## Environment Configuration

### Backend Environment Variables

Set the following in your backend `.env` file:

```bash
# CORS Configuration (comma-separated for multiple origins)
CORS_ORIGIN=https://loyalty-frontend.netlify.app,https://loyalty-admin.netlify.app
```

### Frontend Environment Variables

Set the following in your frontend `.env` file:

```bash
# API Configuration
VITE_API_URL=https://loyalty-backend-production-8e32.up.railway.app/api
```

## Testing CORS Configuration

### 1. CORS Test Endpoint

The backend provides a CORS test endpoint:

```bash
curl -H "Origin: https://loyalty-frontend.netlify.app" \
     https://loyalty-backend-production-8e32.up.railway.app/api/cors-test
```

### 2. Automated CORS Test Script

Run the automated CORS test:

```bash
cd backend
npm run test-cors
```

This script will:
- Test the CORS test endpoint
- Test preflight requests
- Test actual API calls
- Verify CORS headers are properly set

### 3. Browser Testing

1. Open browser developer tools
2. Navigate to `https://loyalty-frontend.netlify.app`
3. Check the Network tab for any CORS errors
4. Look for proper CORS headers in API responses

## Common CORS Issues and Solutions

### Issue: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solutions:**
1. Verify the frontend URL is in the backend's allowed origins
2. Check that the backend is running and accessible
3. Ensure the frontend is using the correct API URL
4. Check browser console for detailed CORS error messages

### Issue: Preflight requests failing

**Solutions:**
1. Ensure OPTIONS method is allowed
2. Check that required headers are in allowedHeaders
3. Verify credentials setting matches your needs

### Issue: Credentials not being sent

**Solutions:**
1. Ensure `credentials: true` is set in CORS config
2. Use `credentials: 'include'` in fetch requests
3. Check that the origin is explicitly allowed (not using wildcard)

## Deployment Checklist

### Backend (Railway)
- [ ] CORS_ORIGIN environment variable is set
- [ ] Backend is accessible at the Railway URL
- [ ] CORS test endpoint returns expected results

### Frontend (Netlify)
- [ ] VITE_API_URL points to Railway backend
- [ ] Frontend builds and deploys successfully
- [ ] No CORS errors in browser console

### Database (Atlas)
- [ ] Database is accessible from Railway
- [ ] Connection string is correct
- [ ] Network access rules allow Railway IPs

## Security Considerations

1. **Never use wildcard origins** (`*`) in production
2. **Explicitly list allowed origins** for better security
3. **Use HTTPS** for all production endpoints
4. **Monitor CORS logs** for blocked requests
5. **Regularly audit** allowed origins

## Troubleshooting Commands

```bash
# Test backend connectivity
curl -I https://loyalty-backend-production-8e32.up.railway.app/api/health

# Test CORS with specific origin
curl -H "Origin: https://loyalty-frontend.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     https://loyalty-backend-production-8e32.up.railway.app/api/health

# Run automated CORS test
npm run test-cors
```

## Support

If you encounter CORS issues:

1. Check the backend logs for CORS warnings
2. Run the automated CORS test script
3. Verify environment variables are set correctly
4. Test with curl commands to isolate the issue
5. Check browser developer tools for detailed error messages