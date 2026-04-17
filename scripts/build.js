#!/usr/bin/env node

/**
 * Comprehensive Build Script for Healthcare Frontend
 * Performs validation checks before building
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`[OK] ${message}`, 'green');
}

function logWarning(message) {
  log(`[WARN] ${message}`, 'yellow');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

function runCommand(command, description, continueOnError = false) {
  const stepStartTime = Date.now();
  try {
    logStep('→', description);
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true,
    });
    const stepTime = ((Date.now() - stepStartTime) / 1000).toFixed(2);
    logSuccess(`${description} completed (${stepTime}s)`);
    return { success: true, time: parseFloat(stepTime) };
  } catch (error) {
    const stepTime = ((Date.now() - stepStartTime) / 1000).toFixed(2);
    if (continueOnError) {
      logWarning(`${description} failed but continuing... (${stepTime}s)`);
      return { success: false, time: parseFloat(stepTime) };
    } else {
      logError(`${description} failed (${stepTime}s)`);
      throw error;
    }
  }
}

function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  const stepTimes = {};

  log('\n' + '='.repeat(60), 'bright');
  log('Healthcare Frontend - Build Process', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  try {
    // 1. Security Audit
    const auditResult = runCommand(
      'npx audit-ci --config audit-ci.json',
      'Security audit'
    );
    stepTimes['Security Audit'] = auditResult.time;

    // 2. Linting
    const lintResult = runCommand('npm run lint', 'ESLint check');
    stepTimes['Linting'] = lintResult.time;

    // 3. Type Checking
    const typeCheckResult = runCommand('npm run type-check', 'TypeScript type checking');
    stepTimes['Type Check'] = typeCheckResult.time;

    // 4. Next.js Build
    const envPrefix = environment === 'production' ? 'cross-env NODE_ENV=production' : 'cross-env NODE_ENV=development';
    const buildResult = runCommand(
      `${envPrefix} next build`,
      `Next.js build (${environment})`
    );
    stepTimes['Next.js Build'] = buildResult.time;

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log('\n' + '='.repeat(60), 'green');
    log(`BUILD COMPLETE! (${totalTime}s)`, 'green');
    log('='.repeat(60) + '\n', 'green');

    process.exit(0);
  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('BUILD FAILED', 'red');
    log('='.repeat(60) + '\n', 'red');
    process.exit(1);
  }
}

main();
