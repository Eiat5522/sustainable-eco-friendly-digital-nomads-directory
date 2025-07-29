class MockMongoClient {
  connect() {
    return Promise.resolve(this);
  }
  db() {
    return {
      collection: (name) => ({
        find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        findOne: jest.fn().mockResolvedValue(null),
      }),
    };
  }
}

module.exports = {
  MongoClient: MockMongoClient,
  default: MockMongoClient,
};
