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
  github: (
    <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.11.79-.25.79-.56 0-.27-.01-1.01-.02-1.98-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a11.09 11.09 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.37-5.28 5.65.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>
  ),
};

const PROVIDERS: Provider[] = [
  { id: 'google', name: 'Google', color: '#FFFFFF', fg: '#111827', icon: Icons.google },
  { id: 'github', name: 'GitHub', color: '#111827', fg: '#FFFFFF', icon: Icons.github },
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
      {enabledProviders.map(p => {
        const buttonStyle = {
          backgroundColor: p.color,
          color: p.fg ?? '#111827',
        };

        return (
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
            style={buttonStyle}
          >
            {p.icon}
          </button>
        );
      })}
    </div>
  );
}

export default SocialAuthRow;
