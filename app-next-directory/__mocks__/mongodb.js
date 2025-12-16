function genHex24() {
  const bytes = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16));
  return bytes.map(b => b.toString(16)).join('');
}

class MockObjectId {
  constructor(id) {
    if (id !== undefined && !MockObjectId.isValid(id)) {
      // Mirror mongodb behavior: constructor accepts 24-hex string; throw on invalid
      throw new Error('Invalid ObjectId');
    }
    this._id = id || genHex24();
  }
  toString() {
    return this._id;
  }
  toHexString() {
    return this._id;
  }
  equals(other) {
    if (!other) return false;
    const s =
      typeof other === 'string'
        ? other
        : typeof other.toString === 'function'
          ? other.toString()
          : '';
    return s === this._id;
  }
  static isValid(value) {
    const s =
      typeof value === 'string'
        ? value
        : typeof value?.toString === 'function'
          ? value.toString()
          : '';
    return /^[a-fA-F0-9]{24}$/.test(s);
  }
}

class MockMongoClient {
  connect() {
    return Promise.resolve(this);
  }
  db() {
    return {
      collection: _name => ({
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

class MockMongoServerError extends Error {
  constructor(info) {
    super((info && (info.errmsg || info.message)) || 'MongoServerError');
    this.name = 'MongoServerError';
    this.code = info?.code;
  }
}

module.exports = {
  MongoClient: MockMongoClient,
  ObjectId: MockObjectId,
  MongoServerError: MockMongoServerError,
  default: {
    MongoClient: MockMongoClient,
    ObjectId: MockObjectId,
    MongoServerError: MockMongoServerError,
  },
};
