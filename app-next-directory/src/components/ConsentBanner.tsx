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
      cookieName="analytics-consent"
      expires={365}
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={() => {
        // Enable analytics tracking and notify interested listeners without full reload
        try {
          window.localStorage.setItem('analytics-enabled', 'true');
          // Dispatch a custom event so analytics bootstrap can initialize listeners
          window.dispatchEvent(new CustomEvent('analytics-consent-accepted', { detail: { enabled: true } }));
        } catch (e) {
          // Fallback: if storage/event dispatch fails, refresh to ensure consistent state
          console.error('Failed to persist analytics consent or dispatch event', e);
          window.location.reload();
        }
      }}
      onDecline={() => {
        // Disable analytics tracking and notify listeners
        try {
          window.localStorage.setItem('analytics-enabled', 'false');
          window.dispatchEvent(new CustomEvent('analytics-consent-declined', { detail: { enabled: false } }));
        } catch (e) {
          console.error('Failed to persist analytics decline or dispatch event', e);
          window.location.reload();
        }
      }}
      style={{
        background: isDark ? '#1f2937' : '#f9fafb',
        color: isDark ? '#f3f4f6' : '#111827',
        borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        padding: '1rem',
      }}
      buttonStyle={{
      background: '#047857', // darker green (AA contrast with white)
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
    >      <p className="text-sm leading-relaxed mb-2">
        We use cookies and similar technologies to help personalize content, enhance your experience, and analyze our traffic.
        We also share information about your use of our site with our analytics partners.
      </p>
      <p className="text-xs leading-relaxed">
        By clicking &quot;Accept&quot;, you consent to the use of these technologies. You can manage your preferences at any time through our{' '}
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
