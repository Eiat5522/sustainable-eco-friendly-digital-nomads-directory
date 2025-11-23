import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'next/link' {
  import { LinkProps as NextLinkProps } from 'next/dist/client/link';

  export interface LinkProps extends NextLinkProps {
    className?: string;
    children: React.ReactNode;
    href: string;
  }

  export default function Link(props: LinkProps): JSX.Element;
}
