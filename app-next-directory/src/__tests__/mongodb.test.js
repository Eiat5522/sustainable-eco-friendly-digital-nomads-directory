// Simplified Jest test for mongodb.js

describe('mongodb.js', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    global._mongoClientPromise = undefined;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global._mongoClientPromise = undefined;
  });

  it('provides a mock client in test environment', async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    
    // Import the module 
    const { default: clientPromise } = await import('../lib/mongodb.js');
    
    // Should return a promise
    expect(clientPromise).toBeInstanceOf(Promise);
    
    // Should resolve to a mock client
    const client = await clientPromise;
    expect(client).toBeDefined();
    expect(typeof client.db).toBe('function');
  });

  it('provides mock database operations', async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    
    const { default: clientPromise } = await import('../lib/mongodb.js');
    const client = await clientPromise;
    const db = client.db('testdb');
    const collection = db.collection('testcollection');
    
    // Test that mock operations are available
    expect(typeof collection.findOne).toBe('function');
    expect(typeof collection.insertOne).toBe('function');
    expect(typeof collection.updateOne).toBe('function');
    expect(typeof collection.deleteOne).toBe('function');
    
    // Test that they return expected mock values
    const findResult = await collection.findOne({});
    expect(findResult).toBeNull();
    
    const insertResult = await collection.insertOne({ test: 'data' });
    expect(insertResult.insertedId).toBe('mock');
  });

  it('handles E2E environment with mocks', async () => {
    process.env.E2E = '1';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    
    const { default: clientPromise } = await import('../lib/mongodb.js');
    
    expect(clientPromise).toBeInstanceOf(Promise);
    const client = await clientPromise;
    expect(client).toBeDefined();
    expect(typeof client.db).toBe('function');
  });
});