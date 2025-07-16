// Type declarations for modules without types

declare module '@auth/nextjs/react' {
  import { SessionProvider as SP } from 'next-auth/react';
  import { useSession as US } from 'next-auth/react';
  import { signIn as SI, signOut as SO } from 'next-auth/react';
  export const SessionProvider: typeof SP;
  export const useSession: typeof US;
  export const signIn: typeof SI;
  export const signOut: typeof SO;
}

declare module 'react-cookie-consent' {
  import React from 'react';
  const CookieConsent: React.ComponentType<any>;
  export default CookieConsent;
}

declare module '@radix-ui/react-select';
declare module '@radix-ui/react-slider';
