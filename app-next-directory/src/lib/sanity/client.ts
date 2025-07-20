/**
 * Sanity Client Configuration
 * 
 * Updated for Schema & TypeScript Refactoring Plan R.3 (Codegen) and R.5 (Image Model)
 * Dual compatibility for Jest (CommonJS) and ES modules with error handling
 */

// Use require for Jest compatibility with proper error handling
let sanityCreateClient, imageUrlBuilder;

try {
  const sanityClientModule = require('@sanity/client');
  sanityCreateClient = sanityClientModule.createClient;
} catch (error) {
  // Fallback for tests or environments where the module isn't available
  sanityCreateClient = () => ({
    config: () => ({}),
    fetch: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve('')
  });
}

try {
  imageUrlBuilder = require('@sanity/image-url');
} catch (error) {
  // Fallback for tests or environments where the module isn't available
  imageUrlBuilder = () => ({
    image: () => ({
      url: () => 'https://example.com/fallback-image.jpg',
      toString: () => 'https://example.com/fallback-image.jpg'
    })
  });
}

// Ensure imageUrlBuilder is a function
if (typeof imageUrlBuilder !== 'function') {
  imageUrlBuilder = () => ({
    image: () => ({
      url: () => 'https://example.com/fallback-image.jpg',
      toString: () => 'https://example.com/fallback-image.jpg'
    })
  });
}

// Create client configuration object
const clientConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'projectId',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'dataset',
  apiVersion: '2024-01-01',
  useCdn: false, // Typically false for tests and server-side logic
};

// Export the createClient function for testing
const createClient = sanityCreateClient;

// Create and export the configured client instance
const client = sanityCreateClient(clientConfig);

// Create and export the image URL builder with error handling
const builder = imageUrlBuilder(client);

// Create a urlFor function for easier usage - supports centralized image model
const urlFor = (source) => builder.image(source);

// CommonJS exports for Jest compatibility
module.exports = {
  createClient,
  client,
  builder,
  urlFor
};

// ES module exports for Next.js compatibility
module.exports.createClient = createClient;
module.exports.client = client;
module.exports.builder = builder;
module.exports.urlFor = urlFor;

// Default export for ES modules
module.exports.default = {
  createClient,
  client,
  builder,
  urlFor
};