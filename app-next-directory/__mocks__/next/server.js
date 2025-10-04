// Custom mocks for NextRequest and NextResponse for Jest/Node environment
export class MockNextRequest {
  constructor({ method, json, url }) {
    this.method = method;
    this._json = json;
    this.url = url
  }
  json() {
    return Promise.resolve(this._json);
  }
}

export class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = init?.headers || { 'Content-Type': 'application/json' };
    this._isNextResponse = true;
  }
  
  async json() {
    if (typeof this.body === 'string') {
      try {
        return JSON.parse(this.body);
      } catch {
        return { message: this.body };
      }
    }
    return this.body;
  }
  
  async text() {
    if (typeof this.body === 'string') {
      return this.body;
    }
    return JSON.stringify(this.body);
  }
}

// Add static methods to MockNextResponse to mimic real NextResponse
MockNextResponse.json = function(data, init = {}) {
  return new MockNextResponse(data, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
};

MockNextResponse.redirect = function(url, status = 307) {
  return new MockNextResponse('', { status, headers: { Location: url } });
};

export function createMocks({ method, json, url }) {
  return {
    req: new MockNextRequest({ method, json, url }),
    res: {},
  };
}

// Export NextResponse as the mock class
export const NextResponse = MockNextResponse;

