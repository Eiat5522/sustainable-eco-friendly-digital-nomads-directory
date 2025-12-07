/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react' {
  export type FC<P extends Record<string, unknown> = Record<string, unknown>> = FunctionComponent<P>;
  export interface FunctionComponent<P extends Record<string, unknown> = Record<string, unknown>> {
    (props: P & { children?: React.ReactNode }): React.ReactElement | null;
  }
  export type ReactNode = React.ReactElement | string | number | boolean | null | undefined;
  export interface ReactElement {
    type: string | React.FC;
    props: Record<string, unknown>;
    key: string | number | null;
  }
  export function useState<T>(initialState: T): [T, (newState: T) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<unknown>): void;
  export function useCallback<T extends (...args: unknown[]) => unknown>(callback: T, deps: ReadonlyArray<unknown>): T;
}
