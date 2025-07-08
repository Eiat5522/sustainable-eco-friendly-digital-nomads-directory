import { RefObject, useEffect } from 'react';

export function useClickOutside<
  T extends HTMLElement = HTMLElement
>(ref: RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current) return;
      if (!(event.target instanceof Node)) {
        handler();
        return;
      }
      if (event.target === ref.current || ref.current.contains(event.target)) return;
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
