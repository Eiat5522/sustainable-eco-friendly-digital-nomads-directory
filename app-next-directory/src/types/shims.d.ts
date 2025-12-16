// Type declarations for modules without types

declare module 'react-cookie-consent' {
  import React from 'react';
  interface CookieConsentProps {
    children?: React.ReactNode;
    onAccept?: () => void;
    onDecline?: () => void;
    buttonText?: string;
    declineButtonText?: string;
    enableDeclineButton?: boolean;
    expires?: number;
    debug?: boolean;
    [key: string]: unknown;
  }
  const CookieConsent: React.ComponentType<CookieConsentProps>;
  export default CookieConsent;
}

declare module '@radix-ui/react-select';
declare module '@radix-ui/react-slider';
