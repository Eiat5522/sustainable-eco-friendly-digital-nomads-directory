class MockMongoClient {
  connect() {
    return Promise.resolve(this);
  }
  db() {
    return {
      collection: (name) => ({
        find: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([]),
        }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        findOne: jest.fn().mockResolvedValue(null),
        countDocuments: jest.fn().mockResolvedValue(0),
      }),
    };
  }
}

module.exports = {
  MongoClient: MockMongoClient,
  default: MockMongoClient,
};
