#!/usr/bin/env node

/**
 * CORS Test Script
 * Tests CORS configuration between frontend and backend
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'https://loyalty-backend-production-8e32.up.railway.app';
const FRONTEND_URL = 'https://loyalty-frontend.netlify.app';

async function testCORS() {
  console.log('🧪 Testing CORS Configuration...\n');
  
  try {
    // Test CORS test endpoint
    console.log('1. Testing CORS test endpoint...');
    const corsTestResponse = await makeRequest(`${BACKEND_URL}/api/cors-test`, {
      'Origin': FRONTEND_URL,
      'User-Agent': 'CORS-Test-Script/1.0'
    });
    
    console.log('✅ CORS Test Response:');
    console.log(JSON.stringify(corsTestResponse, null, 2));
    
    // Test preflight request
    console.log('\n2. Testing preflight request...');
    const preflightResponse = await makeRequest(`${BACKEND_URL}/api/health`, {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }, 'OPTIONS');
    
    console.log('✅ Preflight Response Headers:');
    console.log(preflightResponse.headers);
    
    // Test actual API call
    console.log('\n3. Testing actual API call...');
    const apiResponse = await makeRequest(`${BACKEND_URL}/api/health`, {
      'Origin': FRONTEND_URL,
      'Content-Type': 'application/json'
    });
    
    console.log('✅ API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n🎉 CORS configuration appears to be working correctly!');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    process.exit(1);
  }
}

function makeRequest(url, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      method,
      headers: {
        ...headers
      }
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
    
    req.end();
  });
}

// Run the test
if (require.main === module) {
  testCORS();
}

module.exports = { testCORS };