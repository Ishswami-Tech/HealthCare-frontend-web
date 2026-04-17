/**
 * Test script to verify /api/v1/auth/register endpoint
 * Run: node test-register-endpoint.js
 */

const https = require('https');

const BACKEND_URL = 'https://backend-service-v1.ishswami.in';
const ENDPOINT = '/api/v1/auth/register';

console.log('🔍 Testing Registration Endpoint');
console.log(`📍 URL: ${BACKEND_URL}${ENDPOINT}\n`);

// Test data (will fail validation but should reach the endpoint)
const testData = {
  email: 'test@example.com',
  password: 'Test123!',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  clinicId: '00000000-0000-0000-0000-000000000000', // Dummy UUID for testing
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'backend-service-v1.ishswami.in',
  port: 443,
  path: ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('📤 Sending request...');
console.log('Request headers:', options.headers);
console.log('Request body:', testData);
console.log('');

const req = https.request(options, (res) => {
  console.log(`📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 Response Headers:`, res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📄 Response Body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (res.statusCode === 404) {
        console.log('\n❌ ERROR: Endpoint not found (404)');
        console.log('Possible causes:');
        console.log('  1. Backend server not running');
        console.log('  2. Route not registered');
        console.log('  3. API prefix mismatch');
        console.log('  4. Backend needs restart');
      } else if (res.statusCode === 400) {
        console.log('\n✅ Endpoint exists! (400 = validation error, which is expected)');
        console.log('The endpoint is working, just needs valid data.');
      } else if (res.statusCode === 201) {
        console.log('\n✅ SUCCESS: Registration endpoint is working!');
      }
    } catch (e) {
      console.log(data);
      if (res.statusCode === 404) {
        console.log('\n❌ ERROR: Endpoint not found (404)');
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request Error: ${e.message}`);
  console.error('Possible causes:');
  console.error('  1. Backend server is down');
  console.error('  2. Network connectivity issue');
  console.error('  3. SSL certificate issue');
});

req.setTimeout(10000, () => {
  req.destroy();
  console.error('❌ Request timeout (10s)');
});

req.write(postData);
req.end();

