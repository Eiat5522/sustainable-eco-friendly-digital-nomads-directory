import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Try to use the project's structured logger when available to avoid
// using `console` in library code (helps satisfy lint rules in tests).
let structuredLogger = null;
try {
  // require instead of import to avoid top-level ESM/CJS interop issues in tests
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  structuredLogger = require('./logger').structuredLogger;
} catch (_e) {
  structuredLogger = null;
}

// FORTEST: Lazy initialization to prevent module-scope errors during build
const disableSanity =
  process.env.DISABLE_SANITY_DURING_BUILD === '1' ||
  process.env.DISABLE_SANITY_DURING_BUILD === 'true';

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'placeholder-dataset',
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-05-23', // Use today's date or a fixed date for consistency
  token: process.env.SANITY_API_TOKEN,
};

let _client = null;
let _previewClient = null;
let _builder = null;

function createStubClient() {
  return {
    fetch: async () => null,
    create: async doc => doc,
    patch: () => ({
      set: () => ({ commit: async () => ({}) }),
    }),
  };
}

function initClient() {
  if (_client) return _client;

  if (disableSanity) {
    _client = createStubClient();
    return _client;
  }

  try {
    if (typeof createClient !== 'function') {
      // Unexpected interop - fallback to stub
      _client = createStubClient();
      return _client;
    }
    _client = createClient(config);
    return _client;
  } catch (e) {
    // If the Sanity client cannot be constructed in the test environment,
    // fall back to a safe stub so tests relying on network mocks don't crash.
    // eslint-disable-next-line no-console
      structuredLogger?.warn('Sanity client initialization failed in tests, using stub:', e?.message);
    _client = createStubClient();
    return _client;
  }
}

function initPreviewClient() {
  if (_previewClient) return _previewClient;

  if (disableSanity) {
    _previewClient = createStubClient();
    return _previewClient;
  }

  try {
    if (typeof createClient !== 'function') {
      _previewClient = createStubClient();
      return _previewClient;
    }
    _previewClient = createClient({
      ...config,
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    });
    return _previewClient;
  } catch (e) {
    // eslint-disable-next-line no-console
      structuredLogger?.warn('Sanity preview client init failed in tests, using stub:', e?.message);
    _previewClient = createStubClient();
    return _previewClient;
  }
}

function initBuilder() {
  if (_builder) return _builder;

  if (disableSanity) {
    _builder = {
      image: () => ({
        width: () => ({ height: () => ({ url: () => '' }) }),
        url: () => '',
      }),
    };
    return _builder;
  }

  try {
    // imageUrlBuilder may not be a function in some mocked environments
    if (typeof imageUrlBuilder !== 'function') {
      _builder = {
        image: () => ({ width: () => ({ height: () => ({ url: () => '' }) }), url: () => '' }),
      };
      return _builder;
    }

    const clientInstance = initClient();
    if (!clientInstance || typeof clientInstance !== 'object') {
      _builder = {
        image: () => ({ width: () => ({ height: () => ({ url: () => '' }) }), url: () => '' }),
      };
      return _builder;
    }

    _builder = imageUrlBuilder(clientInstance);
    return _builder;
  } catch (e) {
    // eslint-disable-next-line no-console
      structuredLogger?.warn('Sanity image builder init failed in tests, using stub:', e?.message);
    _builder = {
      image: () => ({ width: () => ({ height: () => ({ url: () => '' }) }), url: () => '' }),
    };
    return _builder;
  }
}

export const client = new Proxy(
  {},
  {
    get(_target, prop) {
      return Reflect.get(initClient(), prop);
    },
  }
);

export const previewClient = new Proxy(
  {},
  {
    get(_target, prop) {
      return Reflect.get(initPreviewClient(), prop);
    },
  }
);

export function urlFor(source) {
  return initBuilder().image(source);
}

// Helper for choosing the right client
export const getClient = (usePreview = false) => (usePreview ? initPreviewClient() : initClient());
