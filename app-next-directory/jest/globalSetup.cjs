module.exports = async () => {
	if (process.env.JEST_USE_REAL_MONGOOSE === '1') {
		require('ts-node/register');
		const handler = await import('../tests/utils/dbHandler.ts');
		await handler.connectInMemoryMongo();
		global.__MONGODB_MEMORY__ = true;
	}
};