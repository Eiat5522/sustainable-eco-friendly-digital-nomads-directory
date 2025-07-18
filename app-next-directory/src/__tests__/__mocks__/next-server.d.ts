// TypeScript module declaration with proper Next.js server exports
declare module 'next/server' {
  export class NextRequest extends Request {
    nextUrl: {
      pathname: string;
      searchParams: URLSearchParams;
      href: string;
      search: string;
      origin: string;
      protocol: string;
      host: string;
      hostname: string;
      port: string;
      hash: string;
    };
    geo?: {
      country?: string;
      region?: string;
      city?: string;
    };
    ip?: string;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      has(name: string): boolean;
      set(name: string, value: string): void;
      delete(name: string): void;
    };
  }

  export class NextResponse extends Response {
    static json(
      object: any,
      init?: ResponseInit
    ): NextResponse;
    static redirect(
      url: string | URL,
      status?: number
    ): NextResponse;
    static rewrite(
      url: string | URL
    ): NextResponse;
    static next(): NextResponse;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      has(name: string): boolean;
      set(name: string, value: string, options?: any): void;
      delete(name: string): void;
    };
  }

  export function ImageResponse(
    element: React.ReactElement,
    options?: any
  ): Response;

  export function userAgent(
    request: NextRequest
  ): {
    isBot: boolean;
    browser: { name?: string; version?: string };
    device: { model?: string; type?: string; vendor?: string };
    engine: { name?: string; version?: string };
    os: { name?: string; version?: string };
    cpu: { architecture?: string };
  };

  export function userAgentFromString(
    userAgentString: string
  ): ReturnType<typeof userAgent>;
}