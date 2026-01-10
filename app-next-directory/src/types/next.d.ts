declare module 'next/image' {
  import type { ImageProps as NextImageProps } from 'next/dist/client/image';
  export default function Image(props: NextImageProps): JSX.Element;
}

declare module 'next/link' {
  import type { LinkProps as NextLinkProps } from 'next/dist/client/link';
  export default function Link(
    props: NextLinkProps &
      React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        children?: React.ReactNode;
      }
  ): JSX.Element;
}
