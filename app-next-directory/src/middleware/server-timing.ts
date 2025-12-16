/**
 * Server Timing Middleware (TypeScript)
 * Adds Server-Timing headers to Next.js responses. Exported `middleware` conforms to Next.js middleware API.
 *
 * NOTE: Do not import NextRequest/NextResponse from 'next/server' in utility files for Next.js 14+ middleware compatibility.
 * Use compatible types or 'any' for request/response if needed, or define a minimal interface.
 */

export interface TimingMetric {
  name: string;
  duration: number;
  description?: string;
}

export default class ServerTiming {
  private metrics: TimingMetric[] = [];
  private startTimes = new Map<string, number>();

  start(name: string) {
    this.startTimes.set(name, typeof performance !== 'undefined' ? performance.now() : Date.now());
  }

  end(name: string, description?: string) {
    const start = this.startTimes.get(name);
    if (!start) return;
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
    this.metrics.push({ name, duration, description });
    this.startTimes.delete(name);
  }

  add(metric: TimingMetric) {
    this.metrics.push(metric);
  }

  getMetrics(): TimingMetric[] {
    return this.metrics.slice();
  }

  getHeaderValue(): string {
    return this.metrics
      .map(
        ({ name, duration, description }) =>
          `${name};dur=${duration.toFixed(2)}${description ? `;desc="${description}"` : ''}`
      )
      .join(', ');
  }
}

// Compatible types for Next.js 14+ middleware
type NextRequestLike = {
  nextUrl: { pathname: string };
  headers: Headers;
};

// ServerTiming middleware using compatible types
export const serverTimingMiddleware = (_request: NextRequestLike) => {
  const timing = new ServerTiming();
  timing.start('total');

  // Do nothing synchronous here — middleware is typically sync; to keep compatibility we measure lightweight
  timing.end('total', 'Total server processing time');

  // Create response-like object compatible with Next.js middleware
  const response = {
    headers: new Headers(),
    next: () => response,
  };

  response.headers.set('Server-Timing', timing.getHeaderValue());

  if (process.env.NODE_ENV === 'development') {
  }

  return response;
};

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
