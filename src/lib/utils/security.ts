/**
 * ✅ Security Utilities
 * Rate limiting, CSRF protection, input validation
 * Follows SOLID, DRY, KISS principles
 * 
 * Note: PHI encryption, TLS 1.3, HIPAA audit logging, GDPR data rights are skipped per requirements
 */

'use client';

import { logger } from './logger';

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry) return this.maxRequests;
    
    const now = Date.now();
    if (now > entry.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Global rate limiters
const authRateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
const generalRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    authRateLimiter.cleanup();
    apiRateLimiter.cleanup();
    generalRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit for authentication operations
 */
export function checkAuthRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
} {
  const allowed = authRateLimiter.isAllowed(identifier);
  const remaining = authRateLimiter.getRemaining(identifier);
  
  if (!allowed) {
    logger.warn('Auth rate limit exceeded', { identifier });
  }
  
  return {
    allowed,
    remaining,
  };
}

/**
 * Check rate limit for API operations
 */
export function checkApiRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
} {
  const allowed = apiRateLimiter.isAllowed(identifier);
  const remaining = apiRateLimiter.getRemaining(identifier);
  
  if (!allowed) {
    logger.warn('API rate limit exceeded', { identifier });
  }
  
  return {
    allowed,
    remaining,
  };
}

/**
 * Check rate limit for general operations
 */
export function checkGeneralRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
} {
  const allowed = generalRateLimiter.isAllowed(identifier);
  const remaining = generalRateLimiter.getRemaining(identifier);
  
  return {
    allowed,
    remaining,
  };
}

/**
 * Reset rate limit for identifier
 */
export function resetRateLimit(identifier: string, type: 'auth' | 'api' | 'general' = 'general'): void {
  switch (type) {
    case 'auth':
      authRateLimiter.reset(identifier);
      break;
    case 'api':
      apiRateLimiter.reset(identifier);
      break;
    case 'general':
      generalRateLimiter.reset(identifier);
      break;
  }
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token
 */
export function storeCSRFToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf_token', token);
  }
}

/**
 * Get stored CSRF token
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('csrf_token');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  if (!storedToken) return false;
  return storedToken === token;
}

// ============================================================================
// Input Validation & Sanitization
// ============================================================================

/**
 * Sanitize string input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Basic phone validation - accepts digits, spaces, dashes, parentheses, plus
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj } as Record<string, any>;
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    }
  }
  
  return sanitized as T;
}

// ============================================================================
// Request Fingerprinting
// ============================================================================

/**
 * Generate request fingerprint for rate limiting
 */
export function generateRequestFingerprint(
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): string {
  const parts: string[] = [];
  
  if (userId) {
    parts.push(`user:${userId}`);
  }
  
  if (ipAddress) {
    parts.push(`ip:${ipAddress}`);
  }
  
  if (userAgent) {
    // Hash user agent to reduce storage
    const hash = userAgent.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    parts.push(`ua:${Math.abs(hash)}`);
  }
  
  return parts.join('|') || 'anonymous';
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userId = localStorage.getItem('user_id');
  const userAgent = navigator.userAgent;
  
  return generateRequestFingerprint(userId || undefined, undefined, userAgent);
}
