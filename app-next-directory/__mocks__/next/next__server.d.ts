declare module '../../../__mocks__/next/server' {
  export function createMocks(options: { method: string; json?: any; url?: string }): { req: any; res: any };
  export class MockNextRequest {
    constructor(options: { method: string; json?: any; url?: string });
  }
  export class MockNextResponse {
    constructor(body: string, init?: { status?: number; headers?: any });
  }
}