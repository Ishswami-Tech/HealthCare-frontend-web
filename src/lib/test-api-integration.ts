// ✅ API Integration Test Suite
// This file provides tests to validate the API integration between frontend and backend

import { clinicApiClient } from './api/client';

export interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  response?: any;
  duration?: number;
}

export interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  duration: number;
}

/**
 * Test API connectivity
 */
async function testApiConnectivity(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await clinicApiClient.ping();
    return {
      test: 'API Connectivity',
      passed: response,
      response: response ? 'Connected' : 'Failed to connect',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'API Connectivity',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await clinicApiClient.getHealthStatus();
    return {
      test: 'Health Endpoint',
      passed: response.success,
      response: response.data,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'Health Endpoint',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test API status endpoint
 */
async function testApiStatusEndpoint(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await clinicApiClient.getApiStatus();
    return {
      test: 'API Status Endpoint',
      passed: response.success,
      response: response.data,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'API Status Endpoint',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test authentication endpoints (without actual auth)
 */
async function testAuthEndpoints(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Test if auth endpoints exist by attempting login with invalid credentials
    // This should fail with 401/400, not 404, which means the endpoint exists
    const response = await clinicApiClient.login({
      email: 'test@example.com',
      password: 'invalid'
    });
    
    return {
      test: 'Auth Endpoints Structure',
      passed: false, // Should never succeed with invalid credentials
      error: 'Authentication unexpectedly succeeded with invalid credentials',
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    // If we get 401/400, the endpoint exists and is working
    if (error?.statusCode === 401 || error?.statusCode === 400) {
      return {
        test: 'Auth Endpoints Structure',
        passed: true,
        response: 'Auth endpoints are accessible and responding correctly',
        duration: Date.now() - startTime
      };
    }
    
    // If we get 404, the endpoint doesn't exist
    if (error?.statusCode === 404) {
      return {
        test: 'Auth Endpoints Structure',
        passed: false,
        error: 'Auth endpoints not found (404)',
        duration: Date.now() - startTime
      };
    }
    
    return {
      test: 'Auth Endpoints Structure',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test appointments endpoints accessibility
 */
async function testAppointmentsEndpoints(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Test if appointments endpoints exist by attempting to access without auth
    // This should fail with 401, not 404, which means the endpoint exists
    const response = await clinicApiClient.getAppointments();
    
    return {
      test: 'Appointments Endpoints Structure',
      passed: false, // Should never succeed without auth
      error: 'Appointments endpoint unexpectedly succeeded without authentication',
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    // If we get 401, the endpoint exists but requires auth
    if (error?.statusCode === 401) {
      return {
        test: 'Appointments Endpoints Structure',
        passed: true,
        response: 'Appointments endpoints are accessible and require authentication',
        duration: Date.now() - startTime
      };
    }
    
    // If we get 404, the endpoint doesn't exist
    if (error?.statusCode === 404) {
      return {
        test: 'Appointments Endpoints Structure',
        passed: false,
        error: 'Appointments endpoints not found (404)',
        duration: Date.now() - startTime
      };
    }
    
    return {
      test: 'Appointments Endpoints Structure',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test user endpoints accessibility
 */
async function testUserEndpoints(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Test if user endpoints exist by attempting to access profile without auth
    // This should fail with 401, not 404, which means the endpoint exists
    const response = await clinicApiClient.getProfile();
    
    return {
      test: 'User Endpoints Structure',
      passed: false, // Should never succeed without auth
      error: 'User profile endpoint unexpectedly succeeded without authentication',
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    // If we get 401, the endpoint exists but requires auth
    if (error?.statusCode === 401) {
      return {
        test: 'User Endpoints Structure',
        passed: true,
        response: 'User endpoints are accessible and require authentication',
        duration: Date.now() - startTime
      };
    }
    
    // If we get 404, the endpoint doesn't exist
    if (error?.statusCode === 404) {
      return {
        test: 'User Endpoints Structure',
        passed: false,
        error: 'User endpoints not found (404)',
        duration: Date.now() - startTime
      };
    }
    
    return {
      test: 'User Endpoints Structure',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test API client configuration
 */
async function testApiClientConfiguration(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Check if environment variables are set
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const clinicId = process.env.NEXT_PUBLIC_CLINIC_ID;
    
    const issues: string[] = [];
    
    if (!apiUrl) {
      issues.push('NEXT_PUBLIC_API_URL not set');
    }
    
    if (!clinicId) {
      issues.push('NEXT_PUBLIC_CLINIC_ID not set (optional but recommended)');
    }
    
    // Test API URL format
    if (apiUrl) {
      try {
        new URL(apiUrl);
      } catch {
        issues.push('NEXT_PUBLIC_API_URL is not a valid URL');
      }
    }
    
    return {
      test: 'API Client Configuration',
      passed: issues.length === 0 || (issues.length === 1 && issues[0].includes('CLINIC_ID')),
      error: issues.length > 0 ? issues.join(', ') : undefined,
      response: {
        apiUrl,
        clinicId: clinicId ? 'Set' : 'Not set',
        configurationIssues: issues
      },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'API Client Configuration',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Run all API integration tests
 */
export async function runApiIntegrationTests(): Promise<TestSuiteResult> {
  const startTime = Date.now();
  
  console.log('🧪 Running API Integration Tests...');
  
  const tests = [
    testApiClientConfiguration,
    testApiConnectivity,
    testHealthEndpoint,
    testApiStatusEndpoint,
    testAuthEndpoints,
    testAppointmentsEndpoints,
    testUserEndpoints,
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    console.log(`Running ${test.name}...`);
    const result = await test();
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.test} - PASSED (${result.duration}ms)`);
    } else {
      console.log(`❌ ${result.test} - FAILED: ${result.error} (${result.duration}ms)`);
    }
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = Date.now() - startTime;
  
  console.log(`\n📊 Test Results: ${passed}/${results.length} passed, ${failed} failed`);
  console.log(`⏱️  Total duration: ${totalDuration}ms`);
  
  return {
    totalTests: results.length,
    passed,
    failed,
    results,
    duration: totalDuration
  };
}

/**
 * Test server actions integration
 */
export async function testServerActionsIntegration(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Import and test server actions
    const { getHealthStatus } = await import('@/lib/actions/health.server');
    
    const result = await getHealthStatus();
    
    return {
      test: 'Server Actions Integration',
      passed: result.status === 'healthy' || result.status === 'unhealthy', // Any response is good
      response: result,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'Server Actions Integration',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Quick API integration check (for development)
 */
export async function quickApiCheck(): Promise<{ healthy: boolean; details: string }> {
  try {
    const connectivityTest = await testApiConnectivity();
    const healthTest = await testHealthEndpoint();
    
    if (connectivityTest.passed && healthTest.passed) {
      return {
        healthy: true,
        details: 'All core API endpoints are responding correctly'
      };
    } else {
      const issues = [];
      if (!connectivityTest.passed) issues.push('API connectivity failed');
      if (!healthTest.passed) issues.push('Health endpoint failed');
      
      return {
        healthy: false,
        details: issues.join(', ')
      };
    }
  } catch (error) {
    return {
      healthy: false,
      details: error instanceof Error ? error.message : 'Unknown error during API check'
    };
  }
}