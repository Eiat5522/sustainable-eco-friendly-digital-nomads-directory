// ESM and CommonJS compatible export for Jest
function createMocks({ method, json }) {
  return {
    req: { method, json },
    res: {},
  };
}

// Support both require() and import
module.exports = { createMocks };
exports.createMocks = createMocks;
export { createMocks }; // ESM named export
