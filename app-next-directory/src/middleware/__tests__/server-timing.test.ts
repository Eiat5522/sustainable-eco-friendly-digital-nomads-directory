import ServerTiming, { serverTimingMiddleware } from '../server-timing';
import { NextRequest } from 'next/server';

describe('ServerTiming', () => {
  let timing: ServerTiming;

  beforeEach(() => {
    timing = new ServerTiming();
  });

  it('should add a metric', () => {
    timing.add({ name: 'test', duration: 100 });
    const metrics = timing.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toEqual({ name: 'test', duration: 100 });
  });

  it('should start and end a timer', () => {
    timing.start('test');
    timing.end('test');
    const metrics = timing.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('test');
    expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
  });

  it('should not add a metric if end is called without start', () => {
    timing.end('test');
    const metrics = timing.getMetrics();
    expect(metrics).toHaveLength(0);
  });

  it('should generate a valid header value', () => {
    timing.add({ name: 'test', duration: 100 });
    timing.add({ name: 'test2', duration: 200, description: 'description' });
    const header = timing.getHeaderValue();
    expect(header).toBe('test;dur=100.00, test2;dur=200.00;desc="description"');
  });
});

describe('middleware', () => {
  it('should add a Server-Timing header to the response', () => {
    const req = new NextRequest('http://localhost');
    const res = serverTimingMiddleware(req);
    const header = res.headers.get('Server-Timing');
    expect(header).toContain('total;dur=');
  });
});
