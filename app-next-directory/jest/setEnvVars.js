// jest/setEnvVars.js
// Use CommonJS for reliable loading in Jest's setupFiles phase
const path = require('node:path');
const dotenv = require('dotenv');

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Force test env to ensure unit tests use mocks instead of real services
process.env.NODE_ENV = 'test';

// React 19 compatibility
process.env.IS_REACT_ACT_ENVIRONMENT = 'true';

process.env.nextAuthSecret = 'test-secret';
process.env.nextPublicSanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';

// Redis environment variables for testing
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:8079';
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'test-token';
