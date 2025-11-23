import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const loadModel = async () => {
  const mod = await import('../UserFavorite');
  return mod.default;
};

describe('UserFavorite model', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('declares the expected schema fields', async () => {
    const UserFavorite = await loadModel();
    const userIdPath = UserFavorite.schema.path('userId');
    const listingIdPath = UserFavorite.schema.path('listingId');
    const createdAtPath = UserFavorite.schema.path('createdAt');

    expect(userIdPath?.isRequired).toBe(true);
    expect(userIdPath?.options.ref).toBe('User');
    expect(listingIdPath?.isRequired).toBe(true);
    expect(listingIdPath?.options.ref).toBe('Listing');
    expect(createdAtPath?.options.default).toBe(Date.now);
  });

  it('registers the compound uniqueness index', async () => {
    const UserFavorite = await loadModel();
    const indexes = (UserFavorite.schema as any).indexes();

    const compound = indexes.find(
      (entry: any) => entry[0].userId === 1 && entry[0].listingId === 1 && entry[1]?.unique === true
    );

    expect(compound).toBeDefined();
  });

  it('sets createdAt defaults to dates and coerces string values in the save hook', async () => {
    const UserFavorite = await loadModel();

    const doc = new UserFavorite({
      userId: new mongoose.Types.ObjectId(),
      listingId: new mongoose.Types.ObjectId(),
    });

    expect(doc.createdAt).toBeInstanceOf(Date);

    const schema = UserFavorite.schema as any;
    const hook = schema.preHooks.get('save')?.[0] as (this: any, next: () => void) => void;
    const manual = new UserFavorite({
      userId: new mongoose.Types.ObjectId(),
      listingId: new mongoose.Types.ObjectId(),
    }) as any;
    manual.createdAt = '2024-02-02T10:00:00.000Z';

    const next = jest.fn();
    hook.call(manual, next);

    expect(manual.createdAt).toBeInstanceOf(Date);
    expect(manual.createdAt.toISOString()).toBe('2024-02-02T10:00:00.000Z');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('leaves Date instances untouched in the save hook', async () => {
    const UserFavorite = await loadModel();
    const schema = UserFavorite.schema as any;
    const hook = schema.preHooks.get('save')?.[0] as (this: any, next: () => void) => void;

    const initial = new Date('2024-02-03T05:06:07Z');
    const doc: any = new UserFavorite({
      userId: new mongoose.Types.ObjectId(),
      listingId: new mongoose.Types.ObjectId(),
      createdAt: initial,
    });

    const next = jest.fn();
    hook.call(doc, next);

    expect(doc.createdAt).toBe(initial);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reuses the compiled model if present in the mongoose cache', async () => {
    jest.resetModules();
    const imported = await import('mongoose');
    const mongooseMod = (imported as any).default ?? imported;
    const cachedModel = Object.assign(jest.fn(), {
      schema: {},
      modelName: 'UserFavorite',
    });
    mongooseMod.models = { UserFavorite: cachedModel } as any;

    const { default: reused } = await import('../UserFavorite');

    expect(reused).toBe(cachedModel);
  });
});
