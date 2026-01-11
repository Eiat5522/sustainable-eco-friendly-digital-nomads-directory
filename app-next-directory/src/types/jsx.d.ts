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
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> & {
      children?: ReactNode;
    };

  export default function Link(props: LinkProps): JSX.Element;
}
