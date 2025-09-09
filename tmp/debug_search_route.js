(async () => {
  const path = require('path');
  // Use the TS source path
  const modulePath = path.resolve(__dirname, '..', 'app-next-directory', 'app', 'api', 'search', 'route.ts');
  console.log('modulePath:', modulePath);
  const sanityClientMock = { client: { fetch: () => Promise.reject(new Error('Sanity API Error')) } };
  const Module = require('module');
  const origRequire = Module.prototype.require;
  Module.prototype.require = function (id) {
    if (typeof id === 'string' && id.includes('lib/sanity/client')) return sanityClientMock;
    return origRequire.apply(this, arguments);
  };

  try {
    // Register ts-node to allow requiring TypeScript files
    require('ts-node/register');
    const route = require(modulePath);
    const q = process.argv[2] || 'test';
    const mockRequest = new Request(`http://localhost:3000/api/search?q=${encodeURIComponent(q)}`, {
      headers: { accept: 'application/json' },
    });
    const res = await route.GET(mockRequest);
    console.log('returned type:', res && typeof res);
    // NextResponse.json returns a Response-like object in Next, but our ApiResponseHandler returns the object from NextResponse.json mock in tests.
    if (res && typeof res.status !== 'undefined') console.log('status:', res.status);
    if (res && typeof res.json === 'function') {
      const body = await res.json();
      console.log('body:', body);
    }
  } catch (e) {
    console.error('error running GET debug:', e);
  } finally {
    Module.prototype.require = origRequire;
  }
})();
