// Match the import path used in tests
declare module '../../../../__mocks__/next/server' {
  export function createMocks(_options: unknown): { req: MockNextRequest; res: unknown };
  export class MockNextRequest {
    constructor(_options: { method: string; json?: unknown });
    method: string;
    json(): Promise<unknown>;
  }
  export class MockNextResponse {
    constructor(body: string, _init?: { status?: number; headers?: Record<string, string> });
    body: string;
    status: number;
    headers: Record<string, string>;
    json(): Promise<unknown>;
  }
}
