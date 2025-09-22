// Minimal mongoose mock to avoid loading real driver during unit tests that import auth modules
const noop = () => {};

class SchemaMock {
  static Types = { ObjectId: class ObjectIdMock {} };
  pre() { return this; }
  index() { return this; }
}

const modelMock = function() { return {}; } as any;
modelMock.findOne = jest.fn();
modelMock.create = jest.fn();
modelMock.findById = jest.fn();
modelMock.findByIdAndUpdate = jest.fn();

const mongoose = {
  Schema: SchemaMock as any,
  Types: { ObjectId: SchemaMock.Types.ObjectId },
  model: () => modelMock,
  models: { User: modelMock },
  connect: async () => ({}),
  connection: {
    on: noop,
    once: noop,
    readyState: 1,
    collection: (_name: string) => ({ insertOne: jest.fn(async () => ({})) }),
  },
};

export = mongoose;
