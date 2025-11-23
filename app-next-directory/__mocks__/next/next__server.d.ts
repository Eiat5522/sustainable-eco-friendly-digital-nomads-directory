// Match the import path used in tests
declare module '../../../../__mocks__/next/server' {
  export function createMocks(options: any): { req: MockNextRequest; res: any };
  export class MockNextRequest {
    constructor(options: { method: string; json?: any });
    method: string;
    json(): Promise<any>;
  }
  export class MockNextResponse {
    constructor(body: string, init?: { status?: number; headers?: Record<string, string> });
    body: string;
    status: number;
    headers: Record<string, string>;
    json(): Promise<any>;
  }
}
