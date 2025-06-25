const createClient = () => ({
  fetch: jest.fn(),
  // Add other methods as needed for your tests
});
module.exports = { createClient };
