declare module '../../../__mocks__/next/server' {
  export function createMocks(options: { method: string; json?: any; url?: string }): { req: any; res: any };
}