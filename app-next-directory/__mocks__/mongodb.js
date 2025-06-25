module.exports = {
  MongoClient: function () {
    return {
      connect: jest.fn().mockResolvedValue({}),
      db: jest.fn().mockReturnValue({}),
      close: jest.fn(),
    };
  },
};
