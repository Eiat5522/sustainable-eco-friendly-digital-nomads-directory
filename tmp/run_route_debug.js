(async () => {
  const Module = require('module');
  const origRequire = Module.prototype.require;
  const sanityClientMock = { client: { fetch: () => Promise.reject(new Error('Sanity API Error')) } };
  Module.prototype.require = function (id) {
    if (typeof id === 'string' && id.includes('lib/sanity/client')) return sanityClientMock;
    return origRequire.apply(this, arguments);
  };
  try {
    const route = require('./route.debug.js');
    const mockRequest = { url: 'http://localhost:3000/api/search?q=test' };
    const res = await route.GET(mockRequest);
    console.log('typeof returned:', typeof res);
    if (res && typeof res.status !== 'undefined') console.log('status:', res.status);
    if (res && typeof res.statusCode !== 'undefined') console.log('statusCode:', res.statusCode);
    console.log('keys on returned object:', res && Object.keys(res || {}));
    if (res && typeof res.json === 'function') {
      const body = await res.json();
      console.log('body:', body);
    } else if (res && typeof res.text === 'function') {
      const text = await res.text();
      console.log('text body:', text);
    } else {
      console.log('no json/text() function on returned object');
    }
  } catch (e) {
    console.error('error invoking route:', e);
  } finally {
    Module.prototype.require = origRequire;
  }
})();