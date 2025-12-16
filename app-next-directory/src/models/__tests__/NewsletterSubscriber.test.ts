import { jest } from '@jest/globals';
import type {
  CallbackWithoutResultAndOptionalError,
  HydratedDocument,
  Model,
  Schema,
  UpdateQuery,
} from 'mongoose';
import type { INewsletterSubscriber } from '../NewsletterSubscriber';

const loadModel = async () => {
  const mod = await import('../NewsletterSubscriber');
  return mod.default;
};

type SchemaWithPreHooks = Schema<INewsletterSubscriber> & {
  preHooks: Map<
    string,
    Array<(this: unknown, next?: CallbackWithoutResultAndOptionalError) => void>
  >;
};

type UpdateHookContext = { getUpdate: () => UpdateQuery<INewsletterSubscriber> };
type UpdateHook = (this: UpdateHookContext, next?: CallbackWithoutResultAndOptionalError) => void;
type ValidateHook = (
  this: HydratedDocument<INewsletterSubscriber> & { createdAt?: Date; updatedAt?: Date },
  next: CallbackWithoutResultAndOptionalError
) => void;

describe('NewsletterSubscriber model', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('exposes the expected schema definition and defaults', async () => {
    const NewsletterSubscriber = await loadModel();

    const emailPath = NewsletterSubscriber.schema.path('email');
    const confirmedAtPath = NewsletterSubscriber.schema.path('confirmedAt');

    expect(emailPath).toBeDefined();
    expect(emailPath.isRequired).toBe(true);
    expect(emailPath.options.lowercase).toBe(true);
    expect(emailPath.options.trim).toBe(true);
    expect(typeof emailPath.options.set).toBe('function');
    expect(emailPath.options.match[0]).toBeInstanceOf(RegExp);

    expect(confirmedAtPath.defaultValue).toBeUndefined();

    const doc = new NewsletterSubscriber({ email: '  USER@Example.com  ' });

    expect(doc.email).toBe('user@example.com');
    expect(doc.confirmedAt).toBeNull();
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });

  it('falls back to manual normalization when the schema setter is unavailable', async () => {
    const NewsletterSubscriber = await loadModel();
    const schema = NewsletterSubscriber.schema as SchemaWithPreHooks;
    const emailPath = schema.path('email');
    const originalSetter = emailPath.options.set;

    emailPath.options.set = undefined;

    const doc = new NewsletterSubscriber({ email: '  SECOND@Example.Com  ' });

    expect(doc.email).toBe('second@example.com');

    emailPath.options.set = originalSetter;
  });

  it('honours provided confirmation timestamps without overwriting them', async () => {
    const NewsletterSubscriber = await loadModel();
    const confirmedAt = new Date('2024-01-02T03:04:05Z');
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const updatedAt = new Date('2024-01-01T00:00:01Z');

    const doc = new NewsletterSubscriber({
      email: 'confirmed@example.com',
      confirmedAt,
      createdAt,
      updatedAt,
    });

    expect(doc.confirmedAt).toBe(confirmedAt);
    expect(doc.createdAt).toBe(createdAt);
    expect(doc.updatedAt).toBe(updatedAt);
  });

  it('normalises update payloads in the pre update hooks', async () => {
    const NewsletterSubscriber = await loadModel();
    const schema = NewsletterSubscriber.schema as SchemaWithPreHooks;
    const hooks = schema.preHooks.get('findOneAndUpdate');
    expect(hooks).toBeDefined();
    const hook = hooks?.[0] as UpdateHook | undefined;

    const update = { email: '  UPDATED@Example.COM  ' };
    const context: UpdateHookContext = { getUpdate: () => update };
    const next = jest.fn();

    hook.call(context, next);

    expect(update.email).toBe('updated@example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('skips normalization when update payload does not include email', async () => {
    const NewsletterSubscriber = await loadModel();
    const schema = NewsletterSubscriber.schema as SchemaWithPreHooks;
    const hook = schema.preHooks.get('updateOne')?.[0] as UpdateHook | undefined;

    const update = { $set: { confirmedAt: new Date() } };
    const context: UpdateHookContext = { getUpdate: () => update };
    hook?.call(context);

    expect(update.$set.confirmedAt).toBeInstanceOf(Date);
  });

  it('normalizes email values nested inside $set payloads', async () => {
    const NewsletterSubscriber = await loadModel();
    const schema = NewsletterSubscriber.schema as SchemaWithPreHooks;
    const hook = schema.preHooks.get('updateOne')?.[0] as UpdateHook | undefined;

    const update = { $set: { email: '  nested@example.COM  ' } };
    const context: UpdateHookContext = { getUpdate: () => update };
    const next = jest.fn();

    hook?.call(context, next);

    expect(update.$set.email).toBe('nested@example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('recompiles the model when an incomplete cached model exists', async () => {
    jest.resetModules();
    const imported = await import('mongoose');
    const mongooseMod = imported.default ?? imported;

    const incomplete = mongooseMod.model('NewsletterSubscriber');
    expect(incomplete.schema).toBeUndefined();

    const { default: compiled } = await import('../NewsletterSubscriber');

    expect(compiled).not.toBe(incomplete);
    expect(compiled.schema.path('email')).toBeDefined();
  });

  it('reuses an existing compiled model from the mongoose cache', async () => {
    jest.resetModules();
    const imported = await import('mongoose');
    const mongooseMod = imported.default ?? imported;
    const cachedModel = Object.assign(jest.fn(), {
      schema: {},
      modelName: 'NewsletterSubscriber',
    }) as unknown as Model<INewsletterSubscriber>;
    mongooseMod.models.NewsletterSubscriber = cachedModel;

    const { default: reused } = await import('../NewsletterSubscriber');

    expect(reused).toBe(cachedModel);
  });

  it('handles validation hook invocation when fields are absent', async () => {
    const NewsletterSubscriber = await loadModel();
    const schema = NewsletterSubscriber.schema as SchemaWithPreHooks;
    const hook = schema.preHooks.get('validate')?.[0] as ValidateHook | undefined;

    const doc: Partial<HydratedDocument<INewsletterSubscriber>> & { isNew: boolean } = {
      isNew: true,
    };
    const next = jest.fn();

    hook?.call(doc as HydratedDocument<INewsletterSubscriber>, next);

    expect(doc.confirmedAt).toBeNull();
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
