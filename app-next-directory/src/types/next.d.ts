declare module 'next/image' {
  import { ImageProps as NextImageProps } from 'next/dist/client/image';
  export default function Image(props: NextImageProps): JSX.Element;
}

declare module 'next/link' {
  import { LinkProps as NextLinkProps } from 'next/dist/client/link';
  export default function Link(props: NextLinkProps & { children?: React.ReactNode }): JSX.Element;
}
