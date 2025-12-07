/**
 * Server Timing Middleware for Next.js
 * 
 * This middleware adds Server-Timing headers to responses
 * to provide server-side performance metrics to the client.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { NextResponse } from 'next/server';
import { SERVER_TIMING_CONFIG } from '../lib/performance/monitoring-config';

/**
 * A simple class to track timing metrics
 */
class ServerTiming {
  constructor() {
    this.metrics = {};
    this.startTimes = {};
  }

  /**
   * Start timing a metric
   * @param {string} name - The name of the metric
   */
  start(name) {
    if (!SERVER_TIMING_CONFIG.enabled) return;
    this.startTimes[name] = performance.now();
  }

  /**
   * End timing a metric
   * @param {string} name - The name of the metric
   * @param {string} description - Optional description of the metric
   */
  end(name, description = '') {
    if (!SERVER_TIMING_CONFIG.enabled) return;
    if (!this.startTimes[name]) return;
    
    const duration = performance.now() - this.startTimes[name];
    this.metrics[name] = {
      duration,
      description
    };
    
    delete this.startTimes[name];
  }

  /**
   * Add a metric directly with a duration
   * @param {string} name - The name of the metric
   * @param {number} duration - The duration in milliseconds
   * @param {string} description - Optional description of the metric
   */
  add(name, duration, description = '') {
    if (!SERVER_TIMING_CONFIG.enabled) return;
    this.metrics[name] = {
      duration,
      description
    };
  }

  /**
   * Get the metrics as a Server-Timing header value
   * @returns {string} - The Server-Timing header value
   */
  getHeaderValue() {
    if (!SERVER_TIMING_CONFIG.enabled) return '';
    
    return Object.entries(this.metrics)
      .map(([name, { duration, description }]) => {
        const desc = description ? `;desc="${description}"` : '';
        return `${name};dur=${duration.toFixed(2)}${desc}`;
      })
      .join(', ');
  }
}

/**
 * Next.js middleware function to add Server-Timing headers
 */
export function serverTimingMiddleware(request, event) {
  // Create a timing object for this request
  const timing = new ServerTiming();
  
  // Start overall timing
  timing.start('total');
  
  // Store the timing object in the request context for later use
  request.serverTiming = timing;
  
  // Process the request normally
  const response = NextResponse.next();
  
  // End overall timing
  timing.end('total', 'Total server processing time');
  
  // Add the Server-Timing header to the response
  response.headers.set('Server-Timing', timing.getHeaderValue());
  
  return response;
}

/**
 * Helper to use server timing in API routes or React Server Components
 */
export function createServerTiming() {
  return new ServerTiming();
}

export default serverTimingMiddleware;
