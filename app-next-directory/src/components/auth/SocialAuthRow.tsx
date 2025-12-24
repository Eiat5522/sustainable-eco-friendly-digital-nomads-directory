'use client';

import { signIn } from 'next-auth/react';
import * as React from 'react';
import { structuredLogger } from '@/lib/logger';

type Provider = {
  id: string;
  name: string;
  color: string; // background color
  fg?: string; // foreground color
  icon: React.ReactNode;
};

// Lightweight brand-ish icons (inline SVGs) to avoid new dependencies.
const Icons = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.73h5.27c-.23 1.2-1.4 3.52-5.27 3.52-3.17 0-5.76-2.62-5.76-5.86S8.83 5.73 12 5.73c1.8 0 3.02.77 3.72 1.43l2.54-2.45C16.69 3.35 14.5 2.5 12 2.5 6.98 2.5 2.9 6.58 2.9 11.6S6.98 20.7 12 20.7c6.96 0 8.1-4.86 8.1-7.2 0-.49-.05-.83-.11-1.2H12z"
      />
    </svg>
  ),
};

const PROVIDERS: Provider[] = [
  { id: 'google', name: 'Google', color: '#FFFFFF', fg: '#111827', icon: Icons.google },
];

export function SocialAuthRow({ providers = PROVIDERS }: Readonly<{ providers?: Provider[] }>) {
  const [pending, setPending] = React.useState<string | null>(null);
  const [availableProviderIds, setAvailableProviderIds] = React.useState<string[] | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  // Allow temporarily disabling all social sign-in buttons via env flag
  // Usage: set NEXT_PUBLIC_AUTH_DISABLE_OAUTH=true in app-next-directory/.env.local
  const OAUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH === 'true';

  React.useEffect(() => {
    if (OAUTH_DISABLED) return;
    let cancelled = false;

    async function loadProviders() {
      try {
        const res = await fetch('/api/auth/providers');
        if (!res.ok) {
          throw new Error(`Providers endpoint returned ${res.status}`);
        }
        const data = (await res.json()) as Record<string, unknown> | null;
        if (cancelled) return;
        if (!data) {
          setAvailableProviderIds([]);
          return;
        }
        const ids = Object.keys(data).filter(id => id !== 'credentials');
        setAvailableProviderIds(ids);
      } catch (err) {
        if (!cancelled) {
          structuredLogger.warn('[auth] Failed to load providers', err, { component: 'auth' });
          setLoadError(true);
          setAvailableProviderIds([]);
        }
      }
    }

    void loadProviders();

    return () => {
      cancelled = true;
    };
  }, [OAUTH_DISABLED]);

  if (OAUTH_DISABLED) {
    return (
      <div className="text-sm text-neo-text-secondary text-center py-2">
        Social sign-in is temporarily unavailable. Please use email sign-in.
      </div>
    );
  }

  if (availableProviderIds === null && !loadError) {
    return (
      <div className="flex justify-center">
        <span className="text-sm text-neo-text-secondary">Loading sign-in options…</span>
      </div>
    );
  }

  const enabledProviders = providers.filter(provider =>
    availableProviderIds?.includes(provider.id)
  );

  if (enabledProviders.length === 0) {
    return (
      <div className="text-sm text-neo-text-secondary text-center">
        {loadError
          ? 'Unable to load social sign-in providers right now.'
          : 'No social sign-in providers are configured.'}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {enabledProviders.map(p => (
        <button
          type="button"
          key={p.id}
          onClick={async () => {
            try {
              setPending(p.id);
              await signIn(p.id);
            } finally {
              // Probably navigates away, but safe fallback:
              setPending(null);
            }
          }}
          disabled={pending === p.id}
          aria-disabled={pending === p.id}
          title={`Continue with ${p.name}`}
          aria-label={`Continue with ${p.name}`}
          className="neo-button neo-button-hover rounded-full w-12 h-12 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
          style={{ backgroundColor: p.color, color: p.fg ?? '#111827' }}
        >
          {p.icon}
        </button>
      ))}
    </div>
  );
}

export default SocialAuthRow;
