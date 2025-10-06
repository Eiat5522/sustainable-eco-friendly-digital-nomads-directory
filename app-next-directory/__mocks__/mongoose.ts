// Enhanced mongoose mock with isValidObjectId and basic model behaviour for unit tests
const noop = () => {};

class ObjectIdMock {
  private _id: string;
  constructor(id?: string) { this._id = id || Math.random().toString(16).slice(2).padEnd(24, '0'); }
  toString() { return this._id; }
  toHexString() { return this._id; }
}

class SchemaMock {
  static Types = { ObjectId: ObjectIdMock };
  paths: Record<string, any> = {};
  options: any = {};
  private indexList: Array<any> = [];
  
  constructor(definition: any, options?: any) {
    this.options = options || {};
    // Store paths for later retrieval
    if (definition) {
      Object.keys(definition).forEach(key => {
        this.paths[key] = {
          path: key,
          instance: this.getInstanceType(definition[key]),
          options: definition[key],
          isRequired: definition[key].required === true,
          enumValues: definition[key].enum,
        };
      });
    }
  }
  
  private getInstanceType(fieldDef: any): string {
    if (!fieldDef || !fieldDef.type) return 'Mixed';
    if (fieldDef.type === String) return 'String';
    if (fieldDef.type === Number) return 'Number';
    if (fieldDef.type === Boolean) return 'Boolean';
    if (fieldDef.type === Date) return 'Date';
    if (fieldDef.type === ObjectIdMock || fieldDef.type.name === 'ObjectId') return 'ObjectId';
    if (Array.isArray(fieldDef.type)) return 'Array';
    return 'Mixed';
  }
  
  path(pathName: string) {
    return this.paths[pathName] || {
      path: pathName,
      options: {},
      isRequired: false,
    };
  }
  
  pre(...args: any[]) { return this; }
  post(...args: any[]) { return this; }
  
  index(fields: any, options?: any) {
    this.indexList.push([fields, options || {}]);
    return this;
  }
  
  indexes() {
    return this.indexList;
  }
}

const collectionStore: Record<string, any> = {};

const createModelMock = (modelName: string, schema?: any) => {
  const modelMock = function(doc?: any) {
    // Return a document-like object
    const instance: any = { ...doc };
    instance._id = instance._id || new ObjectIdMock();
    instance.isNew = true;
    
    // Apply schema defaults
    if (schema && schema.paths) {
      Object.keys(schema.paths).forEach(key => {
        if (instance[key] === undefined) {
          const pathDef = schema.paths[key];
          if (pathDef.options && pathDef.options.default !== undefined) {
            const defaultValue = pathDef.options.default;
            instance[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
          }
        }
      });
    }
    
    instance.save = jest.fn().mockResolvedValue(instance);
    instance.validate = jest.fn().mockResolvedValue(undefined);
    instance.isModified = jest.fn(() => false);
    return instance;
  } as any;
  
  modelMock.modelName = modelName;
  modelMock.schema = schema;
  modelMock.findOne = jest.fn();
  modelMock.create = jest.fn();
  modelMock.findById = jest.fn();
  modelMock.findByIdAndUpdate = jest.fn();
  modelMock.updateOne = jest.fn();
  modelMock.exists = jest.fn();
  modelMock.find = jest.fn();
  modelMock.countDocuments = jest.fn();
  
  return modelMock;
};

function isValidObjectId(id: any): boolean {
  if (id == null) { return false; }
  const value = typeof id === 'string'
    ? id
    : typeof id.toString === 'function'
      ? id.toString()
      : '';
  return /^[a-fA-F0-9]{24}$/.test(value);
}

const modelsCache: Record<string, any> = {};

const mongoose = {
  Schema: SchemaMock as any,
  Types: { ObjectId: SchemaMock.Types.ObjectId },
  model: (name: string, schema?: any) => {
    if (!modelsCache[name]) {
      modelsCache[name] = createModelMock(name, schema);
    }
    return modelsCache[name];
  },
  models: new Proxy({} as any, {
    get: (target, prop: string) => {
      if (!modelsCache[prop]) {
        modelsCache[prop] = createModelMock(prop);
      }
      return modelsCache[prop];
    }
  }),
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
