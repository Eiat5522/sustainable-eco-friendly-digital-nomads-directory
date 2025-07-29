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
    this.status = init.status || 200;
    this.headers = init.headers || { 'Content-Type': 'application/json' };
  }
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
}

export function createMocks({ method, json, url }) {
  return {
    req: new MockNextRequest({ method, json, url }),
    res: {},
  };
}

