// jest/setEnvVars.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
console.log('Loaded .env.test:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, process.env.NODE_ENV); // DEBUG: Remove after troubleshooting
process.env.nextAuthSecret = 'test-secret';
process.env.nextPublicSanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
