#!/usr/bin/env node

/**
 * CORS Test Script
 * This script tests the CORS configuration of the backend server
 */

const https = require('https');
const http = require('http');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://loyalty-backend-production-8e32.up.railway.app';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8081';

console.log('🧪 Testing CORS Configuration');
console.log('Backend URL:', BACKEND_URL);
console.log('Frontend Origin:', FRONTEND_ORIGIN);
console.log('---');

// Test CORS preflight request
function testCorsPreflight() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}/api/cors-test`);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };

    const req = client.request(options, (res) => {
      console.log('📡 CORS Preflight Response:');
      console.log('Status:', res.statusCode);
      console.log('Headers:');
      
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials'
      ];
      
      corsHeaders.forEach(header => {
        const value = res.headers[header];
        if (value) {
          console.log(`  ${header}: ${value}`);
        } else {
          console.log(`  ${header}: ❌ Missing`);
        }
      });
      
      if (res.statusCode === 200 || res.statusCode === 204) {
        console.log('✅ CORS preflight successful');
        resolve(true);
      } else {
        console.log('❌ CORS preflight failed');
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });

    req.end();
  });
}

// Test actual API request
function testApiRequest() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}/api/cors-test`);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 API Request Response:');
        console.log('Status:', res.statusCode);
        console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
        
        if (res.statusCode === 200) {
          console.log('✅ API request successful');
          try {
            const response = JSON.parse(data);
            console.log('Response:', response);
          } catch (e) {
            console.log('Response data:', data);
          }
          resolve(true);
        } else {
          console.log('❌ API request failed');
          console.log('Response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    console.log('1️⃣ Testing CORS preflight...');
    const preflightResult = await testCorsPreflight();
    
    console.log('\n2️⃣ Testing API request...');
    const apiResult = await testApiRequest();
    
    console.log('\n📊 Test Results:');
    console.log('CORS Preflight:', preflightResult ? '✅ PASS' : '❌ FAIL');
    console.log('API Request:', apiResult ? '✅ PASS' : '❌ FAIL');
    
    if (preflightResult && apiResult) {
      console.log('\n🎉 All tests passed! CORS is configured correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Check the CORS configuration.');
      process.exit(1);
    }
  } catch (error) {
    console.log('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();