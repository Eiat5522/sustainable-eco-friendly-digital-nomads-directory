const MongoDBAdapter = jest.fn(() => ({}));

globalThis.__mongoAdapterMock = MongoDBAdapter;

module.exports = {
  MongoDBAdapter,
};
