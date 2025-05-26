import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import CookieConsent from 'react-cookie-consent';

export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Wait for hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={() => {
        // Enable analytics tracking
        window.localStorage.setItem('analytics-enabled', 'true');
        window.location.reload(); // Reload to enable tracking
      }}
      onDecline={() => {
        // Disable analytics tracking
        window.localStorage.setItem('analytics-enabled', 'false');
      }}
      style={{
        background: isDark ? '#1f2937' : '#f9fafb',
        color: isDark ? '#f3f4f6' : '#111827',
        borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        padding: '1rem',
      }}
      buttonStyle={{
        background: '#10b981',
        color: 'white',
        fontSize: '14px',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
      }}
      declineButtonStyle={{
        background: 'transparent',
        border: '1px solid #d1d5db',
        color: isDark ? '#f3f4f6' : '#111827',
        fontSize: '14px',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
      }}
      expires={365} // Cookie expires after 1 year
    >
      <p className="text-sm leading-relaxed mb-2">
        We use cookies and similar technologies to help personalize content, enhance your experience, and analyze our traffic.
        We also share information about your use of our site with our analytics partners.
      </p>
      <p className="text-xs leading-relaxed">
        By clicking "Accept", you consent to the use of these technologies. You can manage your preferences at any time through our{' '}
        <a
          href="/privacy"
          className="underline hover:text-primary-500 transition-colors"
        >
          privacy settings
        </a>.
      </p>
    </CookieConsent>
  );
}
