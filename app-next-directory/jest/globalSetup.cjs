module.exports = async () => {
  // Skip global MongoDB setup - each test file will manage its own connection
  // This prevents issues with ts-node and ESM imports in globalSetup
};
