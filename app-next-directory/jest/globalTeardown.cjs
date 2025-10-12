module.exports = async () => {
	if (process.env.JEST_USE_REAL_MONGOOSE === '1' || global.__MONGODB_MEMORY__) {
		require('ts-node/register');
		const handler = await import('../tests/utils/dbHandler.ts');
		await handler.clearInMemoryMongo();
		await handler.disconnectInMemoryMongo();
	}
};