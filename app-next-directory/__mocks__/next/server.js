// Custom mocks for NextRequest and NextResponse for Jest/Node environment
class MockNextRequest {
  constructor({ method, json, url = 'http://localhost/test' }) {
    this.method = method;
    this._json = json;
    this.url = url;
  }
  json() {
    return Promise.resolve(this._json);
  }
}

class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || { 'Content-Type': 'application/json' };
  }
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
}

function createMocks({ method, json, url = 'http://localhost/test' }) {
  return {
    req: new MockNextRequest({ method, json, url }),
    res: {},
  };
}

module.exports = { createMocks, MockNextRequest, MockNextResponse };
