/**
 * Server Timing Middleware (TypeScript)
 * Adds Server-Timing headers to Next.js responses. Exported `middleware` conforms to Next.js middleware API.
 */

import { NextRequest, NextResponse } from 'next/server';

import { SERVER_TIMING_CONFIG } from '../lib/performance/monitoring-config';

const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

export interface TimingMetric {
  name: string;
  duration: number;
  description?: string;
}

export class ServerTiming {
  private metrics = new Map<string, TimingMetric>();
  private startTimes = new Map<string, number>();

  start(name: string) {
    if (!SERVER_TIMING_CONFIG.enabled) return;
    this.startTimes.set(name, now());
  }

  end(name: string, description?: string) {
    if (!SERVER_TIMING_CONFIG.enabled) return;
    const start = this.startTimes.get(name);
    if (!start) return;
    const duration = now() - start;
    this.metrics.set(name, { name, duration, description });
    this.startTimes.delete(name);
  }

  add(name: string, duration: number, description?: string) {
    if (!SERVER_TIMING_CONFIG.enabled) return;
    this.metrics.set(name, { name, duration, description });
  }

  getMetrics(): TimingMetric[] {
    return Array.from(this.metrics.values());
  }

  getHeaderValue(): string {
    if (!SERVER_TIMING_CONFIG.enabled) return '';

    return this.getMetrics()
      .map(({ name, duration, description }) => `${name};dur=${duration.toFixed(2)}${description ? `;desc="${description}"` : ''}`)
      .join(', ');
  }
}

export function middleware(request: NextRequest) {
  if (!SERVER_TIMING_CONFIG.enabled) {
    return NextResponse.next();
  }

  const timing = new ServerTiming();
  timing.start('total');

  const requestWithTiming = request as NextRequest & { serverTiming?: ServerTiming };
  requestWithTiming.serverTiming = timing;

  const response = NextResponse.next();

  timing.end('total', 'Total server processing time');

  const headerValue = timing.getHeaderValue();
  if (headerValue) {
    response.headers.set('Server-Timing', headerValue);
  }

  if (SERVER_TIMING_CONFIG.verbose && process.env.NODE_ENV !== 'production') {
    console.log(
      '[Server Timing]',
      timing.getMetrics().map((metric) => ({ metric: `server_${metric.name}`, value: Math.round(metric.duration) })),
    );
  }

  return response;
}

export function createServerTiming() {
  return new ServerTiming();
}

export default middleware;

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
