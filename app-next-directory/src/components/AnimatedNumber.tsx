'use client';

import { useCounter } from '@/hooks/useCounter';

interface AnimatedNumberProps {
  value: number;
  start?: number;
  duration?: number; // ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  start = 0,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedNumberProps): React.JSX.Element {
  const { formatted } = useCounter({ start, end: value, duration, decimals });
  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
