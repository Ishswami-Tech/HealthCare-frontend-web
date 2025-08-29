#!/usr/bin/env node

/**
 * Healthcare API Testing Suite
 * Comprehensive testing for all server actions and API endpoints
 */

const https = require('https');
const http = require('http');

class HealthcareAPITester {
  constructor() {
    this.baseURL = 'https://api.ishswami.in';
    this.localURL = 'http://localhost:8088';
    this.frontendURL = 'http://localhost:3000';
    this.clinicId = 'CL0002';
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.request(url, {
        timeout: 5000,
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            success: res.statusCode < 400
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 0,
          error: err.message,
          success: false
        });
      });

      req.on('timeout', () => {
        resolve({
          status: 0,
          error: 'Request timeout',
          success: false
        });
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async testEndpoint(name, url, expectedStatus = 200, options = {}) {
    console.log(`🧪 Testing ${name}...`);
    this.results.total++;

    try {
      const result = await this.makeRequest(url, options);
      
      if (result.status === expectedStatus) {
        console.log(`✅ ${name}: PASSED (${result.status})`);
        this.results.passed++;
        return result;
      } else {
        console.log(`❌ ${name}: FAILED (Expected ${expectedStatus}, got ${result.status})`);
        this.results.failed++;
        this.results.errors.push(`${name}: Expected ${expectedStatus}, got ${result.status}`);
        return result;
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR (${error.message})`);
      this.results.failed++;
      this.results.errors.push(`${name}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testHealthEndpoints() {
    console.log('\n🏥 Testing Health Endpoints...');
    
    // Test external API
    await this.testEndpoint('External API Health', `${this.baseURL}/health`);
    await this.testEndpoint('External API Root', `${this.baseURL}/`);
    
    // Test local API fallback
    await this.testEndpoint('Local API Health', `${this.localURL}/health`);
    await this.testEndpoint('Local API Root', `${this.localURL}/`);
    
    // Test Next.js API
    await this.testEndpoint('Next.js Hello API', `${this.frontendURL}/api/hello`);
  }

  async testAuthenticationEndpoints() {
    console.log('\n🔐 Testing Authentication Endpoints...');
    
    const authEndpoints = [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/auth/logout',
      '/api/auth/verify-otp',
      '/api/auth/forgot-password',
      '/api/auth/reset-password'
    ];

    for (const endpoint of authEndpoints) {
      await this.testEndpoint(
        `Auth ${endpoint}`, 
        `${this.baseURL}${endpoint}`, 
        200,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  async testHealthcareEndpoints() {
    console.log('\n🏥 Testing Healthcare Management Endpoints...');
    
    const endpoints = [
      // Users
      '/api/users',
      '/api/users/profile',
      
      // Appointments  
      '/api/appointments',
      '/api/appointments/schedule',
      
      // Patients
      '/api/patients',
      '/api/patients/medical-history',
      
      // Doctors
      '/api/doctors',
      '/api/doctors/schedule',
      
      // Clinic
      '/api/clinics',
      `/api/clinics/${this.clinicId}`,
      
      // Pharmacy
      '/api/pharmacy/medicines',
      '/api/pharmacy/prescriptions',
      
      // Queue
      '/api/queue/status',
      '/api/queue/next',
      
      // Medical Records
      '/api/medical-records',
      
      // Analytics
      '/api/analytics/dashboard',
      
      // Notifications
      '/api/notifications'
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(`Healthcare ${endpoint}`, `${this.baseURL}${endpoint}`);
    }
  }

  async testFrontendRoutes() {
    console.log('\n🌐 Testing Frontend Routes...');
    
    const routes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/ayurveda',
      '/ayurveda/about',
      '/ayurveda/team',
      '/ayurveda/treatments'
    ];

    for (const route of routes) {
      await this.testEndpoint(`Frontend ${route}`, `${this.frontendURL}${route}`);
    }
  }

  async testServerActionsValidation() {
    console.log('\n⚙️ Testing Server Actions Implementation...');
    
    const fs = require('fs');
    const path = require('path');
    
    const serverActionFiles = [
      'auth.server.ts',
      'users.server.ts', 
      'appointments.server.ts',
      'patients.server.ts',
      'doctors.server.ts',
      'clinic.server.ts',
      'pharmacy.server.ts',
      'queue.server.ts',
      'medical-records.server.ts',
      'analytics.server.ts',
      'notifications.server.ts',
      'health.server.ts'
    ];

    for (const file of serverActionFiles) {
      const filePath = path.join('./src/lib/actions', file);
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const exportMatches = content.match(/export\s+(?:async\s+)?function\s+\w+/g);
          const functionCount = exportMatches ? exportMatches.length : 0;
          
          console.log(`✅ ${file}: ${functionCount} exported functions found`);
          this.results.passed++;
        } else {
          console.log(`❌ ${file}: File not found`);
          this.results.failed++;
        }
        this.results.total++;
      } catch (error) {
        console.log(`❌ ${file}: Error reading file - ${error.message}`);
        this.results.failed++;
        this.results.total++;
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Healthcare API Test Suite...\n');
    
    await this.testHealthEndpoints();
    await this.testAuthenticationEndpoints();
    await this.testHealthcareEndpoints();
    await this.testFrontendRoutes();
    await this.testServerActionsValidation();
    
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🔍 Error Details:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new HealthcareAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = HealthcareAPITester;