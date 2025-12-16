// Match the import path used in tests
declare module '../../../../__mocks__/next/server' {
  export function createMocks(options: Record<string, unknown>): {
    req: MockNextRequest;
    res: Record<string, unknown>;
  };
  export class MockNextRequest {
    constructor(options: { method: string; json?: unknown });
    method: string;
    json(): Promise<unknown>;
  }
  export class MockNextResponse {
    constructor(body: string, init?: { status?: number; headers?: Record<string, string> });
    body: string;
    status: number;
    headers: Record<string, string>;
    json(): Promise<unknown>;
  }
}
