import 'whatwg-fetch';
import { TextDecoder, TextEncoder } from 'node:util';
import { jest } from '@jest/globals';

// Type for headers compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HeadersLike = HeadersInit | Record<string, string> | [string, string][];

type NextResponseInit = { status?: number; headers?: HeadersInit };

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

const needsNodeFetchFallback =
  process.env.JEST_RUN_INTEGRATION !== '1' &&
  (globalThis.Request == null || globalThis.Response == null || globalThis.Headers == null);

if (needsNodeFetchFallback) {
  import('node-fetch')
    .then(nodeFetch => {
      if (!globalThis.Request) {
        globalThis.Request = nodeFetch.Request as unknown as typeof Request;
      }
      if (!globalThis.Response) {
        globalThis.Response = nodeFetch.Response as unknown as typeof Response;
      }
      if (!globalThis.Headers) {
        globalThis.Headers = nodeFetch.Headers as unknown as typeof Headers;
      }
    })
    .catch(() => {
      // Skip if node-fetch cannot be loaded (e.g., ESM-only under the current Jest runtime)
    });
}

const createHeaders = (init?: HeadersInit): Headers => {
  const HeadersCtor = globalThis.Headers;
  if (typeof HeadersCtor === 'function') {
    return new HeadersCtor(init ?? {});
  }

  const map = new Map<string, string>();
  if (init) {
    if (Array.isArray(init)) {
      for (const [key, value] of init) {
        map.set(key, String(value));
      }
    } else if (init instanceof Map) {
      for (const [key, value] of init.entries()) {
        map.set(key, String(value));
      }
    } else if (typeof init === 'object') {
      for (const key of Object.keys(init)) {
        map.set(key, String((init as Record<string, unknown>)[key]));
      }
    }
  }

  const fallback: Headers = {
    append(key: string, value: string) {
      map.set(key, String(value));
    },
    delete(key: string) {
      map.delete(key);
    },
    get(key: string) {
      return map.get(key) ?? null;
    },
    has(key: string) {
      return map.has(key);
    },
    set(key: string, value: string) {
      map.set(key, String(value));
    },
    getSetCookie() {
      return [];
    },
    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: unknown) {
      for (const [key, value] of map.entries()) {
        callbackfn.call(thisArg, value, key, fallback);
      }
    },
    keys() {
      return map.keys();
    },
    values() {
      return map.values();
    },
    entries() {
      return map.entries();
    },
    [Symbol.iterator]() {
      return map.entries();
    },
    get size() {
      return map.size;
    },
  } as Headers;

  return fallback;
};

class MockNextResponse {
  #body: unknown;
  public status: number;
  public headers: Headers;
  public ok: boolean;

  constructor(body?: unknown, init: NextResponseInit = {}) {
    this.#body = body;
    this.status = init.status ?? 200;
    this.headers = createHeaders(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  static next(): MockNextResponse {
    return new MockNextResponse(null, { status: 200 });
  }

  static redirect(url: string | URL, status = 307): MockNextResponse {
    const target = typeof url === 'string' ? url : url.toString();
    return new MockNextResponse(null, {
      status,
      headers: { Location: target },
    });
  }

  static json(data: unknown, init: NextResponseInit = {}): MockNextResponse {
    const headers = createHeaders({
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    });
    return new MockNextResponse(data, { status: init.status, headers });
  }

  async json() {
    if (typeof this.#body === 'string') {
      try {
        return JSON.parse(this.#body);
      } catch (_error) {
        return this.#body;
      }
    }
    return this.#body;
  }

  async text() {
    if (typeof this.#body === 'string') {
      return this.#body;
    }
    try {
      return JSON.stringify(this.#body);
    } catch {
      return String(this.#body);
    }
  }
}

class MockNextRequest {
  #json: unknown;
  public nextUrl: URL;
  public url: string;
  public method: string;
  public headers: Headers;

  constructor(
    input: string | { url: string; method?: string; headers?: HeadersInit; json?: unknown }
  ) {
    if (typeof input === 'string') {
      this.url = input;
      this.method = 'GET';
      this.headers = createHeaders();
      this.#json = undefined;
    } else {
      this.url = input.url;
      this.method = input.method ?? 'GET';
      this.headers = createHeaders(input.headers);
      this.#json = input.json;
    }
    this.nextUrl = new URL(this.url, this.url.startsWith('http') ? undefined : 'http://localhost');
  }

  async json() {
    return this.#json ?? {};
  }
}

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: MockNextResponse,
  NextRequest: MockNextRequest,
  connection: jest.fn(async () => undefined),
}));
