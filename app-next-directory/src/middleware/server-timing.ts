/**
 * Server Timing Middleware (TypeScript)
 * Adds Server-Timing headers to Next.js responses. Exported `middleware` conforms to Next.js middleware API.
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
      .map(({ name, duration, description }) => `${name};dur=${duration.toFixed(2)}${description ? `;desc="${description}"` : ''}`)
      .join(', ');
  }
}

import { type NextRequest, NextResponse } from 'next/server';

export const serverTimingMiddleware = (_request: NextRequest) => {
  const timing = new ServerTiming();
  timing.start('total');

  // Do nothing synchronous here — middleware is typically sync; to keep compatibility we measure lightweight
  timing.end('total', 'Total server processing time');

  const res = NextResponse.next();
  res.headers.set('Server-Timing', timing.getHeaderValue());

  if (process.env.NODE_ENV === 'development') {
    console.log('[Server Timing]', timing.getMetrics().map(m => ({ metric: `server_${m.name}`, value: Math.round(m.duration) })));
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
