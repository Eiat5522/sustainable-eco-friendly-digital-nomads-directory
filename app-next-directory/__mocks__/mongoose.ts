// Enhanced mongoose mock with isValidObjectId and basic model behaviour for unit tests
const noop = () => {};

class ObjectIdMock {
  private _id: string;
  constructor(id?: string) { this._id = id || Math.random().toString(16).slice(2).padEnd(24, '0'); }
  toString() { return this._id; }
}

class SchemaMock {
  static Types = { ObjectId: ObjectIdMock };
  pre() { return this; }
  index() { return this; }
}

const collectionStore: Record<string, any> = {};

const modelMock = function() { return {}; } as any;
modelMock.findOne = jest.fn();
modelMock.create = jest.fn();
modelMock.findById = jest.fn();
modelMock.findByIdAndUpdate = jest.fn();
modelMock.updateOne = jest.fn();
modelMock.exists = jest.fn();

function isValidObjectId(id: any): boolean {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

const mongoose = {
  Schema: SchemaMock as any,
  Types: { ObjectId: SchemaMock.Types.ObjectId },
  model: () => modelMock,
  models: { User: modelMock },
  connect: jest.fn().mockResolvedValue({ readyState: 1, connection: { readyState: 1 } }),
  connection: {
    on: noop,
    once: noop,
    readyState: 1,
    collection: jest.fn((_name: string) => ({
      insertOne: jest.fn(async (doc) => { collectionStore[_name] = collectionStore[_name] || []; collectionStore[_name].push(doc); return { acknowledged: true }; }),
      createIndexes: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue(null),
      updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    })),
  },
  isValidObjectId,
};

// Export both as default and named exports to handle different import styles
export default mongoose;
export = mongoose;
