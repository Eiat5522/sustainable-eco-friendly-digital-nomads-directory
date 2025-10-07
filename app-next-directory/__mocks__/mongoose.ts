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
  private _preHooks: Map<string, Function[]> = new Map();
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
  
  getInstanceType(fieldDef: any) {
    // Determine the string representation of the instance type for schema.path emulation
    if (!fieldDef || !fieldDef.type) return 'Mixed';
    if (fieldDef.type === String) return 'String';
    if (fieldDef.type === Number) return 'Number';
    if (fieldDef.type === Boolean) return 'Boolean';
    if (fieldDef.type === Date) return 'Date';
    if (fieldDef.type === ObjectIdMock || (fieldDef.type && fieldDef.type.name === 'ObjectId')) return 'ObjectId';
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
  
  pre(hookNames: string | string[], fn?: Function) {
    // Normalize to array
    const names = Array.isArray(hookNames) ? hookNames : [hookNames];
    if (typeof fn === 'function') {
      names.forEach((n) => {
        const arr = this._preHooks.get(n) || [];
        arr.push(fn);
        this._preHooks.set(n, arr);
      });
      return this;
    }
    // If no fn provided, return hooks map for inspection (or truthy value)
    return this._preHooks;
  }

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
    const instance: any = { ...doc };
    instance._id = instance._id || new ObjectIdMock();
    instance.isNew = true;
    if (schema) instance.schema = schema;

    const _store: Record<string, any> = {};

    if (schema && schema.paths) {
      Object.keys(schema.paths).forEach(key => {
        const pathDef = schema.paths[key];
        const opts = pathDef && pathDef.options ? pathDef.options : {};
        const hasSetter = opts && (opts.lowercase || opts.trim || typeof opts.set === 'function');

        const initialVal = Object.prototype.hasOwnProperty.call(instance, key) ? instance[key] : undefined;

        if (hasSetter) {
          Object.defineProperty(instance, key, {
            configurable: true,
            enumerable: true,
            get() { return _store[key]; },
            set(val: any) {
              let v = val;
              if (v !== undefined && v !== null && typeof v === 'string') {
                if (opts.trim) v = v.trim();
                if (opts.lowercase) v = v.toLowerCase();
              }
              if (typeof opts.set === 'function') {
                try { v = opts.set(v); } catch (e) { /* ignore */ }
              }
              _store[key] = v;
            }
          });
        }

        if (initialVal !== undefined) {
          try { instance[key] = initialVal; } catch (e) { instance[key] = initialVal; }
        } else if (opts && opts.default !== undefined) {
          const def = typeof opts.default === 'function' ? opts.default() : opts.default;
          try { instance[key] = def; } catch (e) { instance[key] = def; }
        }

        // apply simple normalization for fields without setters
        if (!hasSetter) {
          const val = instance[key];
          if (val !== undefined && val !== null && typeof val === 'string') {
            let v = val;
            if (opts.trim) v = v.trim();
            if (opts.lowercase) v = v.toLowerCase();
            if (typeof opts.set === 'function') {
              try { v = opts.set(v); } catch (e) { /* ignore */ }
            }
            instance[key] = v;
          }
        }
      });
    }

    if (schema && schema.options && schema.options.timestamps) {
      const now = new Date();
      if (instance.createdAt === undefined) instance.createdAt = now;
      if (instance.updatedAt === undefined) instance.updatedAt = now;
    }

    // Run any registered pre('validate') hooks to emulate Mongoose behavior so
    // model-level pre('validate') normalization runs immediately in tests.
    try {
      const validateHooks = (schema && (schema as any)._preHooks && (schema as any)._preHooks.get('validate')) || [];
      validateHooks.forEach((h: Function) => {
        try {
          // Support both (next) => {} and function() { ... }
          if (h.length >= 1) {
            h.call(instance, () => {});
          } else {
            h.call(instance);
          }
        } catch (e) {
          // ignore hook errors in mock
        }
      });
    } catch (e) {
      // ignore
    }

    instance.save = jest.fn().mockResolvedValue(instance);
    instance.validate = jest.fn().mockResolvedValue(undefined);
    instance.isModified = jest.fn(() => false);

    // debug logs removed

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
    // If schema is provided, always (re)create the model using that schema so
    // the compiled model includes schema metadata (setters, defaults, timestamps).
    if (schema) {
      modelsCache[name] = createModelMock(name, schema);
      return modelsCache[name];
    }
    if (!modelsCache[name]) {
      modelsCache[name] = createModelMock(name);
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
