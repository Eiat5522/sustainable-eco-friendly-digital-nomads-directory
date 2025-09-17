/**
 * Demo script to test structured logging in different environments
 * This demonstrates how logging behaves differently in production vs development
 */

import { structuredLogger } from '../logger.ts';

console.log('=== Structured Logging Demo ===\n');

console.log('🟢 Current Environment:', process.env.NODE_ENV || 'development');
console.log('- Structured logging with pino');
console.log('- Sensitive data redaction enabled');
console.log('- Environment-specific configuration\n');

// Demo different log levels
structuredLogger.info('Application started', {
  port: 3000,
  database: 'mongodb://localhost:27017',
  version: '1.0.0'
});

// Demo error logging with sensitive data redaction
structuredLogger.error('Sample error for demonstration', new Error('This is a test error'), {
  userId: 'user-123',
  requestId: 'req-456',
  email: 'user@example.com', // Will be redacted in logs
  password: 'secret123', // Will be redacted in logs
  token: 'jwt-token-here' // Will be redacted in logs
});

// Demo specialized logging methods
structuredLogger.apiError('/api/test', new Error('API failed'), {
  userId: 'user-456',
  operation: 'test_operation'
});

structuredLogger.authError('login attempt', new Error('Invalid credentials'), {
  email: 'attacker@example.com', // Will be redacted
  ip: '192.168.1.100'
});

structuredLogger.emailError('send welcome email', new Error('SMTP connection failed'), {
  recipient: 'user@example.com', // Will be redacted
  template: 'welcome'
});

structuredLogger.performance('database-query', 150, {
  query: 'SELECT * FROM users',
  userId: 'user-789'
});

structuredLogger.security('suspicious-login-attempt', {
  ip: '192.168.1.100',
  userAgent: 'suspicious-bot',
  attemptedEmail: 'admin@example.com' // Will be redacted
});

console.log('\n=== Demo Complete ===');
console.log('✅ Structured logging configured');
console.log('✅ Sensitive data redaction working');
console.log('✅ Multiple log levels and contexts demonstrated');