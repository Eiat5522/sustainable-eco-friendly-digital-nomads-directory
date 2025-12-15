import { jest } from '@jest/globals';
import type { CallbackError, Schema } from 'mongoose';

type PreHook = (this: unknown, next: (err?: CallbackError | null) => void) =>
  | void
  | Promise<void>;

type SchemaWithPreHooks = Schema & { preHooks: Map<string, PreHook[]> };

const ensureMongooseErrors = async () => {
  const imported = await import('mongoose');
  type MongooseModule = typeof import('mongoose') & {
    Error?: typeof import('mongoose')['Error'];
  };

  const mongooseMod = (imported.default ?? imported) as MongooseModule;
  if (!mongooseMod.Error) {
    class MockValidatorError extends Error {
      path: string;
      constructor({ message, path }: { message: string; path: string }) {
        super(message);
        this.path = path;
      }
    }

    class MockValidationError extends Error {
      errors: Record<string, Error> = {};

      constructor() {
        super('Validation failed');
      }

      addError(path: string, error: Error) {
        this.errors[path] = error;
        this.message = error.message;
      }
    }

    mongooseMod.Error = {
      ValidationError: MockValidationError,
      ValidatorError: MockValidatorError,
    } as typeof import('mongoose')['Error'];
  }
  return mongooseMod;
};

const loadModel = async () => {
  const mod = await import('../LoginAttempt');
  return mod.default;
};

describe('LoginAttempt model', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    await ensureMongooseErrors();
  });

  it('defines schema fields with expected defaults and validators', async () => {
    const LoginAttempt = await loadModel();

    const emailPath = LoginAttempt.schema.path('email');
    const reasonPath = LoginAttempt.schema.path('reason');
    const successPath = LoginAttempt.schema.path('success');
    const createdAtPath = LoginAttempt.schema.path('createdAt');

    expect(emailPath?.isRequired).toBe(true);
    expect(emailPath?.options.trim).toBe(true);
    expect(emailPath?.options.lowercase).toBe(true);

    expect(successPath?.isRequired).toBe(true);

    expect(reasonPath?.options.enum).toEqual(['success', 'invalid_credentials', 'rate_limited']);
    expect(createdAtPath?.options.default).toBeInstanceOf(Function);

    const doc = new LoginAttempt({
      email: '  USER@Example.Com  ',
      success: true,
      reason: 'success',
    });
    expect(doc.email).toBe('user@example.com');
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.ip).toBeNull();
  });

  const getValidateHook = async () => {
    const LoginAttempt = await loadModel();
    const schema = LoginAttempt.schema as SchemaWithPreHooks;
    const hook = schema.preHooks.get('validate')?.[0];
    if (!hook) {
      throw new Error('Validate hook is missing');
    }
    return hook;
  };

  it('enforces invariants for successful login attempts via the validate hook', async () => {
    const hook = await getValidateHook();
    const doc: { reason: string; success: boolean } = {
      success: true,
      reason: 'invalid_credentials',
    };
    const next = jest.fn();

    hook.call(doc, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('Successful login attempts');
  });

  it('enforces invariants for failed login attempts via the validate hook', async () => {
    const hook = await getValidateHook();
    const doc: { reason: string; success: boolean } = {
      success: false,
      reason: 'success',
    };
    const next = jest.fn();

    hook.call(doc, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('Failed login attempts');
  });

  it('allows valid combinations in the validate hook', async () => {
    const hook = await getValidateHook();
    const doc: { reason: string; success: boolean } = {
      success: false,
      reason: 'invalid_credentials',
    };
    const next = jest.fn();

    hook.call(doc, next);

    expect(next).toHaveBeenCalledWith();
  });

  const callUpdateHook = async (
    update: unknown,
    options: Record<string, unknown> = {},
    existsResult: unknown = null,
    filter: Record<string, unknown> = { email: 'user@example.com' }
  ) => {
    const LoginAttempt = await loadModel();
    const schema = LoginAttempt.schema as SchemaWithPreHooks;
    const hook = schema.preHooks.get('updateOne')?.[0];

    const exists = jest.fn().mockReturnValue({
      setOptions: jest.fn().mockResolvedValue(existsResult),
    });

    const context = {
      getUpdate: () => update,
      getFilter: () => filter,
      getOptions: () => options,
      model: { exists },
    };

    const next = jest.fn();
    await hook.call(context, next);
    return { next, exists };
  };

  it('rejects pipeline style updates', async () => {
    const { next } = await callUpdateHook([], {});
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((next.mock.calls[0][0] as Error).message).toContain('pipelines');
  });

  it('rejects updates using disallowed operators', async () => {
    const update = { $inc: { success: 1 } };
    const { next } = await callUpdateHook(update);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((next.mock.calls[0][0] as Error).message).toContain('Operator $inc');
  });

  it('rejects conflicting success values across clauses', async () => {
    const update = { success: true, $set: { success: false } };
    const { next } = await callUpdateHook(update);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((next.mock.calls[0][0] as Error).message).toContain('Conflicting success values');
  });

  it('rejects conflicting reason values specified via multiple clauses', async () => {
    const update = {
      success: false,
      reason: 'invalid_credentials',
      $set: { reason: 'rate_limited' },
    };
    const { next } = await callUpdateHook(update);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((next.mock.calls[0][0] as Error).message).toContain('Conflicting reason values');
  });

  it('rejects attempts to unset success or reason fields', async () => {
    const update = { $unset: { success: true } };
    const { next } = await callUpdateHook(update);
    const error = next.mock.calls[0][0] as Error;
    expect(error.message).toContain('cannot be unset');
  });

  it('ensures success remains boolean when provided', async () => {
    const update: unknown = { success: 'yes' };
    const { next } = await callUpdateHook(update);
    expect((next.mock.calls[0][0] as Error).message).toContain('must be a boolean');
  });

  it('ensures reason is a recognised value when provided', async () => {
    const update: unknown = { reason: 'unknown_reason' };
    const { next } = await callUpdateHook(update);
    expect((next.mock.calls[0][0] as Error).message).toContain('not recognised');
  });

  it('rejects invalid success/reason combinations in updates', async () => {
    const update = { success: true, reason: 'invalid_credentials' };
    const { next } = await callUpdateHook(update);
    expect((next.mock.calls[0][0] as Error).message).toContain('Successful login attempts');
  });

  it('rejects updates that conflict with existing records when success is provided alone', async () => {
    const update = { success: true };
    const { next, exists } = await callUpdateHook(update, {}, true);
    expect(exists).toHaveBeenCalled();
    expect((next.mock.calls[0][0] as Error).message).toContain('Cannot set success=true');
  });

  it('rejects updates that conflict with existing records when reason is provided alone', async () => {
    const update = { reason: 'success' };
    const { next, exists } = await callUpdateHook(update, {}, true);
    expect(exists).toHaveBeenCalled();
    expect((next.mock.calls[0][0] as Error).message).toContain('Cannot set reason "success"');
  });

  it('requires both fields when performing upserts', async () => {
    const update = { success: true };
    const { next } = await callUpdateHook(update, { upsert: true });
    expect((next.mock.calls[0][0] as Error).message).toContain(
      'must provide both success and reason'
    );
  });

  it('rejects invalid combinations provided via upsert onInsert values', async () => {
    const update = { $setOnInsert: { success: true, reason: 'invalid_credentials' } };
    const { next } = await callUpdateHook(update, { upsert: true });
    expect((next.mock.calls[0][0] as Error).message).toContain('Successful login attempts');
  });

  it('accepts valid updates when invariants hold', async () => {
    const update = { success: false, reason: 'invalid_credentials' };
    const { next, exists } = await callUpdateHook(update);
    expect(next).toHaveBeenCalledWith();
    expect(exists).not.toHaveBeenCalled();
  });

  it('accepts valid upserts when both fields are provided and consistent', async () => {
    const update = { $setOnInsert: { success: false, reason: 'rate_limited' } };
    const { next } = await callUpdateHook(update, { upsert: true });
    expect(next).toHaveBeenCalledWith();
  });

  it('shares the same update hook across other operations', async () => {
    const LoginAttempt = await loadModel();
    const schema = LoginAttempt.schema as SchemaWithPreHooks;
    const updateHook = schema.preHooks.get('updateOne')?.[0];
    expect(schema.preHooks.get('updateMany')?.[0]).toBe(updateHook);
    expect(schema.preHooks.get('findOneAndUpdate')?.[0]).toBe(updateHook);
  });
});
