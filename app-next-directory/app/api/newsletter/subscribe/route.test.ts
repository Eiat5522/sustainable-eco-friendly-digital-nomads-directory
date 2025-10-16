import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockDbConnect = jest.fn();
const mockFindOne = jest.fn();
const mockSignToken = jest.fn();
const mockBuildEmail = jest.fn();
const mockSendMail = jest.fn();

const redisStore = new Map<string, string>();
const mockRedisClient = {
  get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
  set: jest.fn(async (key: string, value: string) => {
    redisStore.set(key, value);
  }),
  incr: jest.fn(async (key: string) => {
    const current = Number(redisStore.get(key) ?? '0');
    const next = current + 1;
    redisStore.set(key, String(next));
    return next;
  }),
  expire: jest.fn(async () => 1),
};

jest.mock('@/lib/dbConnect', () => ({ __esModule: true, default: mockDbConnect }));
jest.mock('@/models/NewsletterSubscriber', () => ({
  __esModule: true,
  default: { findOne: mockFindOne },
}));
jest.mock('@/lib/newsletterTokens', () => ({
  __esModule: true,
  signNewsletterConfirmToken: mockSignToken,
}));
jest.mock('@/lib/email', () => ({
  __esModule: true,
  buildNewsletterConfirmEmail: mockBuildEmail,
  sendMail: mockSendMail,
}));
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  getRedisClient: jest.fn(() => mockRedisClient),
}));

type RouteModule = typeof import('./route');

const originalEnv = { ...process.env };

const buildEnv = (overrides: Record<string, string | undefined>): NodeJS.ProcessEnv => {
  const env = { ...originalEnv };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
};

const resetMocks = () => {
  mockDbConnect.mockReset();
  mockFindOne.mockReset();
  mockSignToken.mockReset();
  mockBuildEmail.mockReset();
  mockSendMail.mockReset();
  mockSignToken.mockResolvedValue('signed-token');
  mockBuildEmail.mockResolvedValue({ subject: 'Confirm', html: '<p>Confirm</p>' });
  mockSendMail.mockResolvedValue(undefined);
  redisStore.clear();
  mockRedisClient.get.mockReset();
  mockRedisClient.set.mockReset();
  mockRedisClient.incr.mockReset();
  mockRedisClient.expire.mockReset();
  mockRedisClient.get.mockImplementation(async (key: string) => redisStore.get(key) ?? null);
  mockRedisClient.set.mockImplementation(async (key: string, value: string) => {
    redisStore.set(key, value);
  });
  mockRedisClient.incr.mockImplementation(async (key: string) => {
    const current = Number(redisStore.get(key) ?? '0');
    const next = current + 1;
    redisStore.set(key, String(next));
    return next;
  });
  mockRedisClient.expire.mockImplementation(async () => 1);
};

const setFindOneResult = (value: unknown) => {
  const lean = jest.fn().mockResolvedValue(value);
  mockFindOne.mockReturnValue({ lean });
  return lean;
};

const createRequest = (body: unknown, headers: Record<string, string> = {}) => {
  const headerBag = new Headers({ 'content-type': 'application/json', ...headers });
  return new Request('http://localhost/api/newsletter/subscribe', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: headerBag,
  });
};

const createRejectingRequest = (error: Error, headers: Record<string, string> = {}) => ({
  json: () => Promise.reject(error),
  headers: new Headers(headers),
}) as unknown as Request;

const loadRoute = async (envOverrides: Record<string, string | undefined>): Promise<RouteModule> => {
  jest.resetModules();
  process.env = buildEnv(envOverrides);
  resetMocks();
  setFindOneResult(null);
  return import('./route');
};

describe('POST /api/newsletter/subscribe (Jest worker mode)', () => {
  let module: RouteModule;
  let POST: RouteModule['POST'];
  let testControl: RouteModule['testControl'];
  let clearStore: RouteModule['_clearMemoryStore'];
  let memoryIncr: RouteModule['memoryIncr'];

  beforeEach(async () => {
    module = await loadRoute({ JEST_WORKER_ID: '1', NODE_ENV: 'test' });
    ({ POST, testControl, _clearMemoryStore: clearStore, memoryIncr } = module);
    clearStore();
    testControl.memoryGetOverride = undefined;
    testControl.memoryIncrOverride = undefined;
  });

  afterEach(() => {
    testControl.memoryGetOverride = undefined;
    testControl.memoryIncrOverride = undefined;
  });

  it('returns 422 for invalid email', async () => {
    const res = await POST(createRequest({ email: 'not-an-email' }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
  });

  it('rate limits repeated requests from the same IP', async () => {
    const headers = { 'x-forwarded-for': '10.0.0.1' };
    let lastStatus = 200;
    for (let i = 0; i < 11; i++) {
      const res = await POST(createRequest({ email: `user${i}@example.com` }, headers));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('short-circuits duplicate email submissions within the window', async () => {
    const first = await POST(createRequest({ email: 'dup@example.com' }));
    const firstBody = await first.json();
    expect(first.status).toBe(200);
    expect(firstBody.success).toBe(true);

    const second = await POST(createRequest({ email: 'dup@example.com' }));
    const secondBody = await second.json();
    expect(second.status).toBe(200);
    expect(secondBody.message).toBe('Already subscribed recently.');
  });

  it('returns cached response when an idempotency key is replayed', async () => {
    const headers = { 'Idempotency-Key': 'abc-123' };
    const first = await POST(createRequest({ email: 'idem@example.com' }, headers));
    const firstBody = await first.json();
    expect(first.status).toBe(200);

    const second = await POST(createRequest({ email: 'idem@example.com' }, headers));
    const secondBody = await second.json();
    expect(second.status).toBe(200);
    expect(secondBody).toEqual(firstBody);
  });

  it('ignores malformed cached payloads and continues processing', async () => {
    const headers = { 'Idempotency-Key': 'malformed-cache' };
    module.testControl.memoryGetOverride = jest
      .fn()
      .mockResolvedValueOnce('not-json')
      .mockResolvedValue(null);

    const res = await POST(createRequest({ email: 'fresh@example.com' }, headers));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('supports overriding memory helpers for custom behaviour', async () => {
    const getOverride = jest.fn(async (key: string) => {
      if (key.startsWith('newsletter:email')) {
        return '1';
      }
      if (key.includes('idempotency')) {
        return JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Cached!' } });
      }
      return null;
    });
    const incrOverride = jest.fn(async () => 1);
    module.testControl.memoryGetOverride = getOverride;
    module.testControl.memoryIncrOverride = incrOverride;

    const res = await POST(createRequest({ email: 'override@example.com' }, { 'Idempotency-Key': 'override' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Cached!');
    expect(getOverride).toHaveBeenCalled();
    expect(incrOverride).toHaveBeenCalled();
  });

  it('increments memory counters and respects TTL expiration', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const first = await memoryIncr('test-key', 1);
    expect(first).toBe(1);

    nowSpy.mockReturnValue(1_500);
    const second = await memoryIncr('test-key', 1);
    expect(second).toBe(2);

    nowSpy.mockReturnValue(3_500);
    const third = await memoryIncr('test-key', 1);
    expect(third).toBe(1);
    nowSpy.mockRestore();
  });
});

describe('POST /api/newsletter/subscribe (standard mode)', () => {
  let module: RouteModule;
  let POST: RouteModule['POST'];
  let testControl: RouteModule['testControl'];
  let clearStore: RouteModule['_clearMemoryStore'];

  beforeEach(async () => {
    module = await loadRoute({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://localhost/test', JEST_WORKER_ID: undefined });
    ({ POST, testControl, _clearMemoryStore: clearStore } = module);
    clearStore();
    testControl.memoryGetOverride = undefined;
    testControl.memoryIncrOverride = undefined;
  });

  afterEach(() => {
    testControl.memoryGetOverride = undefined;
    testControl.memoryIncrOverride = undefined;
  });

  it('rejects invalid email input', async () => {
    const res = await POST(createRequest({ email: 'invalid' }));
    expect(res.status).toBe(422);
  });

  it('returns stored idempotent response when available', async () => {
    redisStore.set(
      'newsletter:idempotency:stored-key',
      JSON.stringify({ status: 200, body: { success: true, data: null, message: 'From cache' } })
    );

    const res = await POST(createRequest({ email: 'cached@example.com' }, { 'Idempotency-Key': 'stored-key' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('From cache');
  });

  it('enforces IP rate limits using the redis client', async () => {
    redisStore.set('newsletter:ip:unknown', '10');

    const res = await POST(createRequest({ email: 'rate@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain('Too many requests');
  });

  it('returns duplicate response when email has already been seen recently', async () => {
    redisStore.set('newsletter:email:dup@example.com', '1');

    const res = await POST(createRequest({ email: 'dup@example.com' }, { 'Idempotency-Key': 'dup-key' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Already subscribed recently.');
    expect(redisStore.get('newsletter:idempotency:dup-key')).toBeTruthy();
  });

  it('checks MongoDB for confirmed subscribers and short-circuits', async () => {
    const confirmed = { confirmedAt: new Date().toISOString() };
    setFindOneResult(confirmed);

    const res = await POST(createRequest({ email: 'confirmed@example.com' }, { 'Idempotency-Key': 'confirmed' }));
    const body = await res.json();

    expect(mockDbConnect).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(body.message).toBe('You are already subscribed.');
    expect(redisStore.get('newsletter:idempotency:confirmed')).toBeTruthy();
  });

  it('continues gracefully when MongoDB connection fails', async () => {
    mockDbConnect.mockRejectedValueOnce(new Error('db failure'));

    const res = await POST(createRequest({ email: 'continue@example.com' }));
    expect(res.status).toBe(200);
  });

  it('sends confirmation emails outside of test environments', async () => {
    const res = await POST(createRequest({ email: 'notify@example.com' }));

    expect(res.status).toBe(200);
    expect(mockSignToken).toHaveBeenCalledWith('notify@example.com');
    expect(mockBuildEmail).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('swallows email delivery errors to avoid leaking details', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('smtp error'));

    const res = await POST(createRequest({ email: 'no-delivery@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Thank you for subscribing to our newsletter!');
  });

  it('persists idempotency outcomes after successful subscriptions', async () => {
    const res = await POST(createRequest({ email: 'store@example.com' }, { 'Idempotency-Key': 'store-key' }));
    expect(res.status).toBe(200);
    expect(redisStore.get('newsletter:idempotency:store-key')).toBeTruthy();
  });

  it('returns 500 when the request body cannot be parsed', async () => {
    const res = await POST(createRejectingRequest(new Error('bad json')));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('An internal server error occurred.');
  });

  it('falls back to default flow when MONGODB_URI is not configured', async () => {
    module = await loadRoute({ NODE_ENV: 'production', MONGODB_URI: undefined, JEST_WORKER_ID: undefined });
    ({ POST, testControl, _clearMemoryStore: clearStore } = module);
    clearStore();
    testControl.memoryGetOverride = undefined;

    const res = await POST(createRequest({ email: 'no-db@example.com' }));
    expect(res.status).toBe(200);
  });
});

afterAll(() => {
  process.env = originalEnv;
});
