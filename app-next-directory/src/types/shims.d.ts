// Type declarations for modules without types

declare module 'react-cookie-consent' {
  import type { CSSProperties, ReactNode, ComponentType } from 'react';

  export interface CookieConsentProps {
    location?: 'top' | 'bottom' | 'none';
    children?: ReactNode;
    buttonText?: ReactNode;
    declineButtonText?: ReactNode;
    cookieName?: string;
    cookieValue?: string;
    extraCookieOptions?: Record<string, unknown>;
    style?: CSSProperties;
    contentStyle?: CSSProperties;
    buttonStyle?: CSSProperties;
    declineButtonStyle?: CSSProperties;
    overlay?: boolean;
    overlayStyle?: CSSProperties;
    overlayClasses?: string;
    contentClasses?: string;
    buttonWrapperClasses?: string;
    buttonClasses?: string;
    declineButtonClasses?: string;
    containerClasses?: string;
    buttonId?: string;
    disableStyles?: boolean;
    disableButtonStyles?: boolean;
    enableDeclineButton?: boolean;
    flipButtons?: boolean;
    hideOnAccept?: boolean;
    hideOnDecline?: boolean;
    setDeclineCookie?: boolean;
    debug?: boolean;
    visible?: 'byCookieValue' | 'show' | 'hidden';
    acceptOnScroll?: boolean;
    acceptOnScrollPercentage?: number;
    acceptOnScrollInterval?: number;
    acceptOnOverlayClick?: boolean;
    expires?: number | Date;
    sameSite?: 'strict' | 'lax' | 'none';
    ariaAcceptLabel?: string;
    ariaDeclineLabel?: string;
    onAccept?: (acceptedByScrolling: boolean | null) => void;
    onDecline?: () => void;
    onOverlayClick?: () => void;
  }

  const CookieConsent: ComponentType<CookieConsentProps>;
  export default CookieConsent;
}
