import { jest } from '@jest/globals';

const mockHash = jest.fn().mockResolvedValue('$2a$12$hashed');

jest.mock('bcryptjs', () => ({
  hash: (...args: unknown[]) => mockHash(...args),
}));

const loadModule = async () => {
  const mod = await import('../User');
  return mod;
};

describe('User model', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockHash.mockResolvedValue('$2a$12$hashed');
    delete process.env.BCRYPT_COST;
  });

  it('defaults the bcrypt cost to 12 when the environment variable is absent', async () => {
    delete process.env.BCRYPT_COST;
    const { BCRYPT_COST } = await loadModule();
    expect(BCRYPT_COST).toBe(12);
  });

  it('reads the bcrypt cost from the environment', async () => {
    process.env.BCRYPT_COST = '8';
    const { BCRYPT_COST } = await loadModule();
    expect(BCRYPT_COST).toBe(8);
  });

  it('declares schema fields with appropriate defaults and validators', async () => {
    const { default: User, ROLE_VALUES } = await loadModule();

    const emailPath = User.schema.path('email') as any;
    const rolePath = User.schema.path('role') as any;
    const passwordPath = User.schema.path('password') as any;

    expect(emailPath.isRequired).toBeDefined();
    expect(emailPath.options.trim).toBe(true);
    expect(emailPath.options.lowercase).toBe(true);
    expect(typeof emailPath.options.validate.validator).toBe('function');

    expect(rolePath.options.enum).toEqual(ROLE_VALUES);
    expect(rolePath.options.default).toBe('user');

    expect(passwordPath.options.select).toBe(false);
    expect(passwordPath.isRequired).toBe(false);
  });

  it('instantiates documents with normalised email and timestamps', async () => {
    const { default: User } = await loadModule();

    const doc = new User({
      email: '  TEST@Example.COM  ',
      name: 'Example',
      emailVerified: null,
      image: 'https://example.com/avatar.png',
    });

    expect(doc.email).toBe('test@example.com');
    expect(doc.role).toBe('user');
    expect(doc.emailVerified).toBeNull();
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });

  const invokeSaveHook = async (doc: any, next = jest.fn()) => {
    const { default: User } = await loadModule();
    const schema = User.schema as any;
    const hook = schema.preHooks.get('save')?.[0] as (
      this: any,
      next: (err?: unknown) => void
    ) => Promise<void>;
    await hook.call(doc, next);
    return next;
  };

  it('hashes passwords when the field is modified', async () => {
    const { default: User, BCRYPT_COST } = await loadModule();
    const doc: any = new User({ email: 'user@example.com', password: 'password123' });
    doc.isModified = jest.fn().mockReturnValue(true);

    const next = await invokeSaveHook(doc);

    expect(doc.password).toBe('$2a$12$hashed');
    expect(mockHash).toHaveBeenCalledWith('password123', BCRYPT_COST);
    expect(next).toHaveBeenCalledWith();
  });

  it('skips hashing when the password has not been modified', async () => {
    const { default: User } = await loadModule();
    const doc: any = new User({ email: 'user@example.com', password: 'unchanged' });
    doc.isModified = jest.fn().mockReturnValue(false);

    const next = await invokeSaveHook(doc);

    expect(mockHash).not.toHaveBeenCalled();
    expect(doc.password).toBe('unchanged');
    expect(next).toHaveBeenCalledWith();
  });

  it('skips hashing when the password is undefined even if marked modified', async () => {
    const { default: User } = await loadModule();
    const doc: any = new User({ email: 'user@example.com' });
    doc.isModified = jest.fn().mockReturnValue(true);

    const next = await invokeSaveHook(doc);

    expect(mockHash).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('does not rehash passwords that are already bcrypt hashes', async () => {
    const { default: User } = await loadModule();
    const doc: any = new User({ email: 'user@example.com', password: '$2a$12$existingHash' });
    doc.isModified = jest.fn().mockReturnValue(true);

    const next = await invokeSaveHook(doc);

    expect(mockHash).not.toHaveBeenCalled();
    expect(doc.password).toBe('$2a$12$existingHash');
    expect(next).toHaveBeenCalledWith();
  });

  it('propagates hashing errors through the save hook', async () => {
    const { default: User } = await loadModule();
    const doc: any = new User({ email: 'user@example.com', password: 'password123' });
    doc.isModified = jest.fn().mockReturnValue(true);

    mockHash.mockImplementationOnce(() => Promise.reject(new Error('hash failure')));

    const next = jest.fn();
    const schema = User.schema as any;
    const hook = schema.preHooks.get('save')?.[0] as (
      this: any,
      next: (err?: unknown) => void
    ) => Promise<void>;
    await hook.call(doc, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((next.mock.calls[0][0] as Error).message).toBe('hash failure');
  });

  it('reuses a cached compiled model when available', async () => {
    jest.resetModules();
    const imported = await import('mongoose');
    const mongooseMod = (imported as any).default ?? imported;
    const cachedModel = Object.assign(jest.fn(), {
      schema: {},
      modelName: 'User',
    });
    mongooseMod.models = { User: cachedModel } as any;

    const { default: reused } = await import('../User');
    expect(reused).toBe(cachedModel);
  });
});
