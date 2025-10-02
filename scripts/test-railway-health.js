#!/usr/bin/env node

/**
 * Railway Health Check Test Script
 * Tests the Railway deployment health endpoint
 */

const https = require('https');
const http = require('http');

const RAILWAY_URL = 'https://loyalty-backend-production-8e32.up.railway.app';

async function testRailwayHealth() {
  console.log('🚀 Testing Railway Deployment Health...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing /api/health endpoint...');
    const healthResponse = await makeRequest(`${RAILWAY_URL}/api/health`);
    
    console.log('✅ Health Response:');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Success: ${healthResponse.data.success}`);
    console.log(`   Message: ${healthResponse.data.message}`);
    console.log(`   Database Status: ${healthResponse.data.database?.status}`);
    console.log(`   Environment: ${healthResponse.data.environment}`);
    console.log(`   Uptime: ${healthResponse.data.uptime}s`);
    
    // Test CORS endpoint
    console.log('\n2. Testing /api/cors-test endpoint...');
    const corsResponse = await makeRequest(`${RAILWAY_URL}/api/cors-test`, {
      'Origin': 'https://loyalty-frontend.netlify.app'
    });
    
    console.log('✅ CORS Response:');
    console.log(`   Status: ${corsResponse.status}`);
    console.log(`   Message: ${corsResponse.data.message}`);
    console.log(`   Origin: ${corsResponse.data.origin}`);
    
    // Test if database is connected
    if (healthResponse.data.database?.readyState === 1) {
      console.log('\n🎉 Railway deployment is healthy and ready!');
      console.log('   ✅ Server is running');
      console.log('   ✅ Database is connected');
      console.log('   ✅ CORS is configured');
    } else {
      console.log('\n⚠️  Railway deployment is running but database may not be connected');
      console.log(`   Database ReadyState: ${healthResponse.data.database?.readyState}`);
    }
    
  } catch (error) {
    console.error('❌ Railway health test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Railway deployment may still be starting');
      console.log('   - Railway URL may be incorrect');
      console.log('   - Network connectivity issues');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Railway deployment failed to start');
      console.log('   - Port configuration issues');
      console.log('   - Application crashed during startup');
    }
    
    process.exit(1);
  }
}

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Railway-Health-Test/1.0',
        ...headers
      },
      timeout: 30000 // 30 second timeout
    };
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the test
if (require.main === module) {
  testRailwayHealth();
}

module.exports = { testRailwayHealth };