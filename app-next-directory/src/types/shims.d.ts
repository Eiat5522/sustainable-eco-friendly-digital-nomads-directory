// Type declarations for modules without types

declare module 'react-cookie-consent' {
  import type React from 'react';
  const CookieConsent: React.ComponentType<
    Record<string, string | number | boolean | object | null | undefined>
  >;
  export default CookieConsent;
}

declare module '@radix-ui/react-select';

