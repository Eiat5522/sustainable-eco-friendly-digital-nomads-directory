/**
 * Server Timing Middleware
 *
 * This middleware adds Server-Timing headers to responses to track
 * backend performance metrics. Use this to monitor database queries,
 * external API calls, and rendering time.
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

// NOTE: Do not import NextRequest/NextResponse from 'next/server' in utility files for Next.js 14+ middleware compatibility.

export interface TimingMetric {
  name: string
  duration: number
  description?: string
}

class ServerTiming {
  private metrics: TimingMetric[] = []
  private startTimes: Map<string, number> = new Map()

  /**
   * Start timing a metric
   */
  startTiming(name: string) {
    this.startTimes.set(name, performance.now())
  }

  /**
   * End timing a metric and record its duration
   */
  endTiming(name: string, description?: string) {
    const startTime = this.startTimes.get(name)
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.push({ name, duration, description })
      this.startTimes.delete(name)
    }
  }

  /**
   * Add a pre-calculated metric
   */
  addMetric(metric: TimingMetric) {
    this.metrics.push(metric)
  }

  /**
   * Generate the Server-Timing header value
   */
  getHeaderValue(): string {
    return this.metrics
      .map(({ name, duration, description }) => {
        const value = `${name};dur=${duration.toFixed(2)}${
          description ? `;desc="${description}"` : ''
        }`
        return value
      })
      .join(', ')
  }
}

/**
 * Next.js middleware to add Server-Timing headers
 */
  const timing = new ServerTiming();
  // Start overall request timing
  timing.startTiming('total-time');
  // Create response (mock for compatibility)
  const response = { headers: new Map(), setHeader: function(k: string, v: string) { this.headers.set(k, v); } };
  // End timing and add header
  timing.endTiming('total-time', 'Total processing time');
  response.setHeader('Server-Timing', timing.getHeaderValue());
  // Also send metrics to Plausible if in production
  if (process.env.NODE_ENV === 'production') {
    const metrics = timing.metrics.map(({ name, duration }) => ({
      metric: `server_${name}`,
      value: Math.round(duration),
      rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor'
    }));
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Server Timing]', metrics);
    }
  }
  return response;
}

// Optional: Configure paths that should include server timing
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
