const https = require('https');

// Custom fetch implementation using https module to avoid dependency issues
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = options.body || '';
    
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data));
            } catch (e) {
              return Promise.resolve({ error: 'Invalid JSON', raw: data });
            }
          },
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function testLogin() {
  const url = 'https://backend-service-v1.ishswami.in/api/v1/auth/login';
  const body = {
    email: 'agent_test_73829@example.com',
    password: 'Password123!',
    clinicId: 'CL0002'
  };
  
  console.log('Testing login to:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Clinic-ID': 'CL0002' },
      body: JSON.stringify(body)
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));
    
    if (data.user) {
        console.log('User found.');
        if (!data.user.role) {
            console.log('WARNING: User role is missing!');
        } else {
            console.log('User role:', data.user.role);
        }
    } else {
        console.log('WARNING: User object missing in response!');
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

testLogin();
