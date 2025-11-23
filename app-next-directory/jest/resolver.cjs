const { defaultResolver } = require('jest-resolve');

module.exports = (request, options) => {
  try {
    const resolver = options?.defaultResolver || defaultResolver;
    return resolver(request, options);
  } catch (error) {
    if (typeof request === 'string' && request.endsWith('.js')) {
      const tsRequest = request.replace(/\.js$/, '.ts');
      const tsxRequest = request.replace(/\.js$/, '.tsx');

      try {
        const resolver = options?.defaultResolver || defaultResolver;
        return resolver(tsRequest, options);
      } catch {
        try {
          const resolver = options?.defaultResolver || defaultResolver;
          return resolver(tsxRequest, options);
        } catch {
          // fall through to rethrow original error
        }
      }
    }

    throw error;
  }
};
