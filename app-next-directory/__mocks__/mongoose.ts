// Enhanced mongoose mock with isValidObjectId and basic model behaviour for unit tests
const noop = () => {};

class ObjectIdMock {
  private _id: string;
  constructor(id?: string) {
    this._id = id || Math.random().toString(16).slice(2).padEnd(24, '0');
  }
  toString() {
    return this._id;
  }
  toHexString() {
    return this._id;
  }
}

// Types used inside this mock
type Hook = (this: unknown, next?: () => void) => void;
type SetterFunction = (v: unknown) => unknown;

interface PathOptions {
  type?: unknown;
  required?: boolean;
  enum?: unknown[];
  lowercase?: boolean;
  trim?: boolean;
  set?: SetterFunction;
  default?: unknown;
}

interface PathDef {
  path: string;
  instance: string;
  options: PathOptions | Record<string, unknown>;
  isRequired: boolean;
  enumValues?: unknown[];
}

class SchemaMock {
  static Types = { ObjectId: ObjectIdMock };
  paths: Record<string, PathDef> = {};
  options: Record<string, unknown> = {};
  // expose preHooks so tests / mock can inspect and the model factory can run them
  public preHooks: Map<string, Hook[]> = new Map();
  private indexList: Array<[Record<string, unknown>, Record<string, unknown>]> = [];

  constructor(definition?: Record<string, PathOptions>, options?: Record<string, unknown>) {
    this.options = options || {};
    // Store paths for later retrieval
    if (definition) {
      Object.keys(definition).forEach(key => {
        const def = definition[key];
        this.paths[key] = {
          path: key,
          instance: this.getInstanceType(def),
          options: def,
          isRequired: !!def.required,
          enumValues: def.enum,
        };
      });
    }
  }

  getInstanceType(fieldDef?: PathOptions) {
    // Determine the string representation of the instance type for schema.path emulation
    if (!fieldDef || !fieldDef.type) return 'Mixed';
    if (fieldDef.type === String) return 'String';
    if (fieldDef.type === Number) return 'Number';
    if (fieldDef.type === Boolean) return 'Boolean';
    if (fieldDef.type === Date) return 'Date';
    if (
      fieldDef.type === ObjectIdMock ||
      (fieldDef.type && (fieldDef.type as any).name === 'ObjectId')
    )
      return 'ObjectId';
    if (Array.isArray((fieldDef as any).type)) return 'Array';
    return 'Mixed';
  }

  path(pathName: string) {
    return (
      this.paths[pathName] ||
      ({
        path: pathName,
        options: {} as Record<string, unknown>,
        isRequired: false,
      } as PathDef)
    );
  }

  pre(hookNames: string | string[], fn?: Hook) {
    // Normalize to array
    const names = Array.isArray(hookNames) ? hookNames : [hookNames];
    if (typeof fn === 'function') {
      names.forEach(n => {
        const arr = this.preHooks.get(n) || [];
        arr.push(fn);
        this.preHooks.set(n, arr);
      });
      return this;
    }
    // If no fn provided, return hooks map for inspection
    return this.preHooks;
  }

  post(..._args: unknown[]) {
    return this;
  }

  index(fields: Record<string, unknown>, options?: Record<string, unknown>) {
    this.indexList.push([fields, options || {}]);
    return this;
  }

  indexes() {
    return this.indexList;
  }
}

const collectionStore: Record<string, Array<Record<string, unknown>>> = {};

const createModelMock = (modelName: string, schema?: SchemaMock) => {
  const modelMock = ((doc?: Record<string, unknown>) => {
    const instance: Record<string, unknown> = { ...(doc || {}) };
    instance._id = instance._id || new ObjectIdMock();
    instance.isNew = true;
    if (schema) (instance as any).schema = schema; // keep runtime shape for code that expects .schema

    const _store: Record<string, unknown> = {};

    if (schema?.paths) {
      Object.keys(schema.paths).forEach(key => {
        const pathDef = schema.paths[key];
        const opts =
          pathDef?.options ? (pathDef.options as PathOptions) : ({} as PathOptions);
        const hasSetter = !!(
          opts &&
          (opts.lowercase || opts.trim || typeof opts.set === 'function')
        );

        const initialVal = Object.hasOwn(instance, key) ? instance[key] : undefined;

        if (hasSetter) {
          Object.defineProperty(instance, key, {
            configurable: true,
            enumerable: true,
            get() {
              return _store[key];
            },
            set(val: unknown) {
              let v: unknown = val;
              if (v !== undefined && v !== null && typeof v === 'string') {
                if (opts.trim) v = (v as string).trim();
                if (opts.lowercase) v = (v as string).toLowerCase();
              }
              if (typeof opts.set === 'function') {
                try {
                  v = opts.set(v);
                } catch (_e) {
                  /* ignore */
                }
              }
              _store[key] = v;
            },
          });
        }

        if (initialVal !== undefined) {
          try {
            instance[key] = initialVal;
          } catch (_e) {
            instance[key] = initialVal;
          }
        } else if (opts && (opts as PathOptions).default !== undefined) {
          const defaultVal = (opts as PathOptions).default;
          let def = defaultVal;
          if (typeof defaultVal === 'function') {
            // Special case for Mongoose's `Date.now` default
            if (opts.type === Date && defaultVal === Date.now) {
              def = new Date();
            } else {
              def = defaultVal();
            }
          }
          instance[key] = def;
        }

        // apply simple normalization for fields without setters
        if (!hasSetter) {
          const val = instance[key];
          if (val !== undefined && val !== null && typeof val === 'string') {
            let v: unknown = val;
            if (opts.trim) v = (v as string).trim();
            if (opts.lowercase) v = (v as string).toLowerCase();
            if (typeof opts.set === 'function') {
              try {
                v = opts.set(v);
              } catch (_e) {
                /* ignore */
              }
            }
            instance[key] = v;
          }
        }
      });
    }

    if (schema && (schema as SchemaMock).options && (schema as SchemaMock).options.timestamps) {
      const now = new Date();
      if (instance.createdAt === undefined) instance.createdAt = now;
      if (instance.updatedAt === undefined) instance.updatedAt = now;
    }

    // Run any registered pre('validate') hooks to emulate Mongoose behavior so
    // model-level pre('validate') normalization runs immediately in tests.
    try {
      const validateHooks = (schema?.preHooks?.get('validate')) || [];
      validateHooks.forEach(h => {
        try {
          // Support both (next) => {} and function() { ... }
          if ((h as Hook).length >= 1) {
            (h as Hook).call(instance, () => {});
          } else {
            (h as Hook).call(instance);
          }
        } catch (_e) {
          // ignore hook errors in mock
        }
      });
    } catch (_e) {
      // ignore
    }

    (instance as any).save = jest.fn().mockResolvedValue(instance);
    (instance as any).validate = jest.fn().mockResolvedValue(undefined);
    (instance as any).isModified = jest.fn(() => false);

    // Set the prototype to make `instanceof` checks work
    Object.setPrototypeOf(instance, modelMock.prototype);

    return instance;
  }) as unknown as (...args: unknown[]) => Record<string, unknown>;

  // attach some runtime helpers that tests may use
  (modelMock as any).modelName = modelName;
  (modelMock as any).schema = schema;
  (modelMock as any).findOne = jest.fn();
  (modelMock as any).create = jest.fn();
  (modelMock as any).findById = jest.fn();
  (modelMock as any).findByIdAndUpdate = jest.fn();
  (modelMock as any).updateOne = jest.fn();
  (modelMock as any).exists = jest.fn();
  (modelMock as any).find = jest.fn();
  (modelMock as any).countDocuments = jest.fn();

  return modelMock;
};

function isValidObjectId(id: unknown): boolean {
  if (id == null) {
    return false;
  }
  const value =
    typeof id === 'string'
      ? id
      : typeof (id as { toString?: () => string }).toString === 'function'
        ? (id as { toString: () => string }).toString()
        : '';
  return /^[a-fA-F0-9]{24}$/.test(value);
}

const modelsCache: Record<string, ReturnType<typeof createModelMock>> = {};

const mongoose = {
  Schema: SchemaMock,
  Types: { ObjectId: SchemaMock.Types.ObjectId },
  model: (name: string, schema?: SchemaMock) => {
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
  models: new Proxy({} as Record<string, ReturnType<typeof createModelMock>>, {
    get: (_target, prop: string | symbol) => {
      const key = String(prop);
      // Return an existing cached model only. Do NOT auto-create a model
      // without a schema because that causes modules to pick up a model
      // whose `.schema` is undefined. Real Mongoose returns `undefined`
      // from `models[name]` when the model hasn't been compiled yet.
      return modelsCache[key];
    },
  }),
  connect: jest.fn().mockResolvedValue({ readyState: 1, connection: { readyState: 1 } }),
  connection: {
    on: noop,
    once: noop,
    readyState: 1,
    collection: jest.fn((_name: string) => ({
      insertOne: jest.fn(async (doc: Record<string, unknown>) => {
        collectionStore[_name] = collectionStore[_name] || [];
        collectionStore[_name].push(doc);
        return { acknowledged: true };
      }),
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
export { SchemaMock as Schema };
