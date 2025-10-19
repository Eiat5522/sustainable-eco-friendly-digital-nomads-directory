import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const loadModel = async () => {
  const mod = await import('../PasswordResetToken');
  return mod.default;
};

describe('PasswordResetToken model', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('describes required schema fields and validators', async () => {
    const PasswordResetToken = await loadModel();
    const userIdPath = PasswordResetToken.schema.path('userId');
    const tokenHashPath = PasswordResetToken.schema.path('tokenHash') as any;
    const expiresAtPath = PasswordResetToken.schema.path('expiresAt');

    expect(userIdPath?.isRequired).toBe(true);
    expect(userIdPath?.options.ref).toBe('User');
    expect(expiresAtPath?.isRequired).toBe(true);

    expect(tokenHashPath?.isRequired).toBe(true);
    expect(tokenHashPath?.options.select).toBe(false);
    expect(tokenHashPath?.options.lowercase).toBe(true);
    expect(tokenHashPath?.options.minlength).toBe(64);
    expect(tokenHashPath?.options.maxlength).toBe(64);
    expect(tokenHashPath?.options.match).toEqual(/^[a-f0-9]{64}$/);
  });

  it('registers all expected indexes', async () => {
    const PasswordResetToken = await loadModel();
    const indexes = (PasswordResetToken.schema as any).indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ userId: 1 }), expect.objectContaining({ unique: true })],
        [expect.objectContaining({ expiresAt: 1 }), expect.objectContaining({ expireAfterSeconds: 0 })],
        [expect.objectContaining({ tokenHash: 1 }), expect.any(Object)],
      ]),
    );
  });

  it('ensures createdAt defaults to a Date instance', async () => {
    const PasswordResetToken = await loadModel();

    const doc = new PasswordResetToken({
      userId: new mongoose.Types.ObjectId(),
      tokenHash: 'a'.repeat(64),
      expiresAt: new Date(Date.now() + 1000),
    });

    expect(doc.createdAt).toBeInstanceOf(Date);
  });

  it('coerces createdAt values to Date inside the save hook', async () => {
    const PasswordResetToken = await loadModel();
    const schema = PasswordResetToken.schema as any;
    const hook = schema.preHooks.get('save')?.[0] as (this: any, next: () => void) => void;

    const doc: any = new PasswordResetToken({
      userId: new mongoose.Types.ObjectId(),
      tokenHash: 'b'.repeat(64),
      expiresAt: new Date(Date.now() + 2000),
    });

    doc.createdAt = '2024-01-01T00:00:00.000Z';

    const next = jest.fn();
    hook.call(doc, next);

    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('keeps Date instances intact within the save hook', async () => {
    const PasswordResetToken = await loadModel();
    const schema = PasswordResetToken.schema as any;
    const hook = schema.preHooks.get('save')?.[0] as (this: any, next: () => void) => void;

    const initialDate = new Date('2023-12-31T23:59:59.000Z');
    const doc: any = new PasswordResetToken({
      userId: new mongoose.Types.ObjectId(),
      tokenHash: 'c'.repeat(64),
      expiresAt: new Date(Date.now() + 3000),
      createdAt: initialDate,
    });

    const next = jest.fn();
    hook.call(doc, next);

    expect(doc.createdAt).toBe(initialDate);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reuses an existing compiled model from the mongoose cache', async () => {
    jest.resetModules();
    const imported = await import('mongoose');
    const mongooseMod = (imported as any).default ?? imported;
    const cachedModel = Object.assign(jest.fn(), {
      schema: {},
      modelName: 'PasswordResetToken',
    });
    mongooseMod.models = { PasswordResetToken: cachedModel } as any;

    const { default: reused } = await import('../PasswordResetToken');
    expect(reused).toBe(cachedModel);
  });
});
