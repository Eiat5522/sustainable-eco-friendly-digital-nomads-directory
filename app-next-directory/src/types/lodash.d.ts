declare module 'lodash/debounce' {
  export default function debounce<T extends (...args: never[]) => void>(
    func: T,
    wait: number,
    options?: {
      leading?: boolean;
      maxWait?: number;
      trailing?: boolean;
    }
  ): T;
}
