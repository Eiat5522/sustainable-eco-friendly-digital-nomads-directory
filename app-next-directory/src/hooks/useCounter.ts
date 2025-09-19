"use client";

import { useEffect, useRef, useState } from 'react';

export interface UseCounterOptions {
  start?: number; // starting value
  end: number;    // final value to reach
  duration?: number; // ms duration
  easing?: (t: number) => number; // easing fn applied to progress [0..1]
  decimals?: number; // fixed decimals
  once?: boolean; // if true, subsequent end changes won't re-run
}

// Default easeOutCubic
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * useCounter animates a numeric value from start to end over duration using requestAnimationFrame.
 * - Pure React hook, no DOM refs needed
 * - Works in client components only
 */
export function useCounter({
  start = 0,
  end,
  duration = 2000,
  easing = easeOutCubic,
  decimals = 0,
  once = false,
}: UseCounterOptions) {
  const [value, setValue] = useState<number>(start);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef<boolean>(false);

  useEffect(() => {
  // Reset started flag when non-end dependencies change (unless it's the initial mount)
  if (!once) {
    startedRef.current = false;
  }
  
  if (once && startedRef.current) return;

    const startTime = performance.now();
    const from = start;
    const to = end;

    startedRef.current = true;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easing(progress);
      const current = from + (to - from) * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // It's intentional to re-run when end/duration/easing/start change (unless once)
  }, [start, end, duration, easing, once]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return { value, formatted } as const;
}
