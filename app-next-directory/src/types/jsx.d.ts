import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: HTMLAttributes<HTMLElement>;
    }
  }
}

declare module 'next/link' {
  import type { LinkProps as NextLinkProps } from 'next/dist/client/link';

  export type LinkProps = NextLinkProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
      children?: ReactNode;
    };

  export default function Link(props: LinkProps): JSX.Element;
}
