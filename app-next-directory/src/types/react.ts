import type { PropsWithChildren, ReactElement } from 'react';

/**
 * Helper props alias that enforces explicit prop definitions while preserving React's children typing.
 */
export type StrictProps<P extends object = Record<string, never>> = PropsWithChildren<P>;

/**
 * Strongly typed component signature that mirrors React.FC without globally monkey-patching React's types.
 *
 * By default the props resolve to `Record<string, never>`, ensuring components without custom props remain valid
 * while preventing accidental implicit `any` usage when accessing unknown properties.
 */
export type StrictComponent<P extends object = Record<string, never>> = (
  props: StrictProps<P>
) => ReactElement | null;
