#!/usr/bin/env node

/**
 * WebSocket Testing Tool
 * 
 * Comprehensive tool for testing WebSocket connections, including:
 * - Health namespace testing
 * - Main namespace testing
 * - Authentication token retrieval
 * - Connection monitoring and latency testing
 * 
 * Usage:
 *   node scripts/test-websocket.js [command] [options]
 * 
 * Commands:
 *   test          Test WebSocket connection (default)
 *   get-token     Get authentication token from API
 * 
 * Options:
 *   --url <url>           WebSocket/API URL
 *   --health              Test health namespace (/health)
 *   --main                Test main namespace (default: /)
 *   --interval <ms>       Monitoring interval in milliseconds (default: 5000)
 *   --duration <seconds>  Run for specified duration (default: infinite)
 *   --verbose             Show detailed logs
 *   --token <token>       Authentication token (optional)
 *   --email <email>       Email for token retrieval
 *   --password <pwd>      Password for token retrieval
 */

const { io } = require('socket.io-client');
const https = require('https');
const http = require('http');
const readline = require('readline');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('--') ? args[0] : 'test';
const options = {
  url: null,
  namespace: '/',
  health: false,
  main: true,
  interval: 5000,
  duration: null,
  verbose: false,
  token: null,
  email: null,
  password: null,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--url' && args[i + 1]) {
    options.url = args[++i];
  } else if (arg === '--health') {
    options.health = true;
    options.main = false;
    options.namespace = '/health';
  } else if (arg === '--main') {
    options.main = true;
    options.health = false;
    options.namespace = '/';
  } else if (arg === '--interval' && args[i + 1]) {
    options.interval = parseInt(args[++i], 10);
  } else if (arg === '--duration' && args[i + 1]) {
    options.duration = parseInt(args[++i], 10) * 1000;
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--token' && args[i + 1]) {
    options.token = args[++i];
  } else if (arg === '--email' && args[i + 1]) {
    options.email = args[++i];
  } else if (arg === '--password' && args[i + 1]) {
    options.password = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
WebSocket Testing Tool

Commands:
  test          Test WebSocket connection (default)
  get-token     Get authentication token from API

Usage:
  node scripts/test-websocket.js [command] [options]

Options:
  --url <url>           WebSocket/API URL
  --health              Test health namespace (/health)
  --main                Test main namespace (default: /)
  --interval <ms>       Monitoring interval (default: 5000)
  --duration <seconds>  Run duration (default: infinite)
  --verbose             Show detailed logs
  --token <token>       Authentication token (optional)
  --email <email>       Email for token retrieval
  --password <pwd>      Password for token retrieval
  --help, -h            Show this help message

Examples:
  # Test health namespace (recommended)
  node scripts/test-websocket.js test --health --url wss://backend-service-v1.ishswami.in

  # Test health namespace with verbose output
  node scripts/test-websocket.js test --health --url wss://backend-service-v1.ishswami.in --verbose

  # Get authentication token
  node scripts/test-websocket.js get-token --email user@example.com --password pass123

  # Test with token (optional - health namespace is public)
  node scripts/test-websocket.js test --health --token "your-token-here"
    `);
    process.exit(0);
  }
}

// Get default URL from environment or use default
function getDefaultUrl() {
  // Try to read from .env file
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const wsUrlMatch = envContent.match(/NEXT_PUBLIC_WEBSOCKET_URL=(.+)/);
      const wsUrlAltMatch = envContent.match(/NEXT_PUBLIC_WS_URL=(.+)/);
      if (wsUrlMatch) return wsUrlMatch[1].trim();
      if (wsUrlAltMatch) return wsUrlAltMatch[1].trim();
    }
  } catch (e) {
    // Ignore errors
  }
  return 'wss://backend-service-v1.ishswami.in';
}

// Get authentication token
async function getAuthToken() {
  const apiUrl = options.url || getDefaultUrl().replace('wss://', 'https://').replace('ws://', 'http://');
  
  if (!options.email || !options.password) {
    console.error(`${colors.red}Error: Email and password are required${colors.reset}`);
    console.log(`Usage: node scripts/test-websocket.js get-token --email <email> --password <password> [--url <api-url>]`);
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${apiUrl}/api/v1/auth/login`);
    const postData = JSON.stringify({
      email: options.email,
      password: options.password,
    });

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            const token = response.access_token || response.token || response.data?.access_token;
            if (token) {
              console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
              console.log(`${colors.cyan}Token:${colors.reset} ${token}`);
              console.log(`\n${colors.yellow}You can use this token with:${colors.reset}`);
              console.log(`node scripts/test-websocket.js test --health --token "${token}"`);
              resolve(token);
            } else {
              console.error(`${colors.red}✗ Token not found in response${colors.reset}`);
              if (options.verbose) {
                console.log(`${colors.gray}Response: ${data}${colors.reset}`);
              }
              reject(new Error('Token not found in response'));
            }
          } catch (e) {
            console.error(`${colors.red}✗ Failed to parse response${colors.reset}`);
            if (options.verbose) {
              console.log(`${colors.gray}Response: ${data}${colors.reset}`);
            }
            reject(e);
          }
        } else {
          console.error(`${colors.red}✗ Authentication failed: ${res.statusCode} ${res.statusMessage}${colors.reset}`);
          if (options.verbose) {
            console.log(`${colors.gray}Response: ${data}${colors.reset}`);
          }
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`${colors.red}✗ Connection error: ${error.message}${colors.reset}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test WebSocket connection
async function testWebSocket() {
  const wsUrl = options.url || getDefaultUrl();
  const fullUrl = `${wsUrl}${options.namespace}`;

  console.log(`${colors.bright}${colors.cyan}Connecting to: ${fullUrl}${colors.reset}\n`);

  // Connection statistics
  const stats = {
    connected: 0,
    disconnected: 0,
    reconnected: 0,
    errors: [],
    latencies: [],
    messagesSent: 0,
    messagesReceived: 0,
    startTime: Date.now(),
  };

  // Socket.IO connection options
  const socketOptions = {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
    forceNew: false,
    // Health namespace is public - don't send auth headers unless token is explicitly provided
    // This ensures we don't trigger authentication middleware unnecessarily
    ...(options.health && !options.token ? {
      // Explicitly don't send auth for public health namespace
      auth: {},
      query: {},
      extraHeaders: {},
    } : {}),
  };

  // Add authentication if token provided (optional for health namespace)
  if (options.token) {
    socketOptions.auth = { token: options.token };
    socketOptions.query = { token: options.token };
    socketOptions.extraHeaders = {
      Authorization: `Bearer ${options.token}`,
    };
  }

  const socket = io(fullUrl, socketOptions);

  // Connection events
  socket.on('connect', () => {
    stats.connected++;
    const socketId = socket.id;
    console.log(`${colors.green}✓ Connected successfully${colors.reset}`);
    if (options.verbose) {
      console.log(`${colors.gray}Socket ID: ${socketId}${colors.reset}`);
    }
    console.log('');
  });

  socket.on('disconnect', (reason) => {
    stats.disconnected++;
    console.log(`${colors.yellow}⚠ Disconnected: ${reason}${colors.reset}`);
  });

  socket.on('reconnect', (attemptNumber) => {
    stats.reconnected++;
    console.log(`${colors.green}✓ Reconnected after ${attemptNumber} attempts${colors.reset}`);
  });

  socket.on('connect_error', (error) => {
    const errorMsg = error.message || 'Connection error';
    stats.errors.push({ time: new Date(), message: errorMsg });
    
    if (errorMsg.includes('Authentication') || errorMsg.includes('token') || errorMsg.includes('session')) {
      console.log(`${colors.red}✗ Connection error: ${errorMsg}${colors.reset}`);
      console.log(`${colors.yellow}ℹ Note: Health namespace is public - authentication is optional${colors.reset}`);
      console.log(`${colors.yellow}   You can connect without --token flag${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Connection error: ${errorMsg}${colors.reset}`);
    }
  });

  // Health namespace specific events
  if (options.health) {
    socket.on('health:status', (data) => {
      stats.messagesReceived++;
      if (options.verbose) {
        console.log(`${colors.blue}📊 Health Status Update:${colors.reset}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${colors.blue}📊 Health status received${colors.reset}`);
      }
    });

    socket.on('health:service:update', (update) => {
      stats.messagesReceived++;
      if (options.verbose) {
        console.log(`${colors.blue}📊 Service Update:${colors.reset}`, JSON.stringify(update, null, 2));
      }
    });

    // Subscribe to health updates
    socket.on('connect', () => {
      socket.emit('health:subscribe', { room: 'health:all' }, (response) => {
        if (response && response.success) {
          console.log(`${colors.green}✓ Subscribed to health updates${colors.reset}`);
          if (options.verbose && response.status) {
            console.log(`${colors.blue}Initial Status:${colors.reset}`, JSON.stringify(response.status, null, 2));
          }
        }
      });
    });
  }

  // Latency testing
  let latencyTestInterval;
  if (options.interval > 0) {
    latencyTestInterval = setInterval(() => {
      if (socket.connected) {
        const startTime = Date.now();
        socket.emit('ping', () => {
          const latency = Date.now() - startTime;
          stats.latencies.push(latency);
          
          // Keep only last 100 latencies
          if (stats.latencies.length > 100) {
            stats.latencies.shift();
          }

          if (options.verbose) {
            const avgLatency = stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length;
            const minLatency = Math.min(...stats.latencies);
            const maxLatency = Math.max(...stats.latencies);
            console.log(`${colors.cyan}Latency: ${latency}ms (Avg: ${avgLatency.toFixed(0)}ms, Min: ${minLatency}ms, Max: ${maxLatency}ms)${colors.reset}`);
          }
        });
      }
    }, options.interval);
  }

  // Display statistics periodically
  const statsInterval = setInterval(() => {
    if (socket.connected) {
      const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
      const avgLatency = stats.latencies.length > 0
        ? (stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length).toFixed(0)
        : 'N/A';
      const minLatency = stats.latencies.length > 0 ? Math.min(...stats.latencies) : 'N/A';
      const maxLatency = stats.latencies.length > 0 ? Math.max(...stats.latencies) : 'N/A';

      console.log(`\n${colors.bright}${colors.cyan}=== Connection Statistics ===${colors.reset}`);
      console.log(`Status: ${colors.green}Connected${colors.reset}`);
      console.log(`Uptime: ${uptime}s`);
      console.log(`Connections: ${stats.connected}`);
      console.log(`Reconnections: ${stats.reconnected}`);
      console.log(`Messages Received: ${stats.messagesReceived}`);
      console.log(`Latency: Avg ${avgLatency}ms, Min ${minLatency}ms, Max ${maxLatency}ms`);
      if (stats.errors.length > 0) {
        console.log(`Errors: ${colors.red}${stats.errors.length}${colors.reset}`);
      }
      console.log('');
    }
  }, 10000);

  // Handle duration limit
  if (options.duration) {
    setTimeout(() => {
      console.log(`\n${colors.yellow}Duration limit reached. Closing connection...${colors.reset}`);
      socket.disconnect();
      clearInterval(latencyTestInterval);
      clearInterval(statsInterval);
      process.exit(0);
    }, options.duration);
  }

  // Graceful shutdown
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
    socket.disconnect();
    clearInterval(latencyTestInterval);
    clearInterval(statsInterval);
    rl.close();
    process.exit(0);
  });
}

// Main execution
(async () => {
  try {
    if (command === 'get-token') {
      await getAuthToken();
    } else if (command === 'test') {
      await testWebSocket();
    } else {
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      console.log(`Use --help for usage information`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
