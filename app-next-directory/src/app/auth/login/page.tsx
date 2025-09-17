"use client";

import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams?.get('callbackUrl') ?? undefined;

  const callbackUrl = React.useMemo(() => {
    if (!rawCallbackUrl) return undefined;
    if (rawCallbackUrl.startsWith('/')) return rawCallbackUrl;

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(rawCallbackUrl, window.location.origin);
        if (url.origin === window.location.origin) {
          return `${url.pathname}${url.search}${url.hash}`;
        }
      } catch {
        // Ignore invalid callback URLs and fall back to defaults
      }
    }

    return undefined;
  }, [rawCallbackUrl]);

  const isAuthenticated = status === 'authenticated';
  const displayName = session?.user?.name ?? session?.user?.email ?? 'your account';

  const handleProviderSignIn = (provider: string) => {
    const options = callbackUrl ? { callbackUrl } : undefined;
    void signIn(provider, options);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-black rounded-xl bg-white p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        <h1 className="heading-lg mb-2">Sign in</h1>
        <p className="body-md text-neo-text-secondary mb-6">
          Choose a provider to continue
        </p>

        {isAuthenticated && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Signed in successfully</p>
              <p className="text-sm text-emerald-700">
                You're signed in as {displayName}. {callbackUrl ? 'You can head back to your previous page.' : 'Feel free to continue exploring listings.'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            className="w-full btn btn-primary"
            onClick={() => handleProviderSignIn('google')}
            disabled={isAuthenticated}
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="w-full btn btn-primary"
            onClick={() => handleProviderSignIn('facebook')}
            disabled={isAuthenticated}
          >
            Continue with Facebook
          </button>
          <button
            type="button"
            className="w-full btn btn-primary"
            onClick={() => handleProviderSignIn('twitter')}
            disabled={isAuthenticated}
          >
            Continue with X
          </button>
          <button
            type="button"
            className="w-full btn btn-primary"
            onClick={() => handleProviderSignIn('microsoft-entra-id')}
            disabled={isAuthenticated}
          >
            Continue with Microsoft
          </button>
        </div>

        <p className="text-xs text-neo-text-secondary mt-6">
          Note: Only configured providers will work in this environment.
        </p>
        <div className="mt-6 flex items-center justify-between text-sm">
          <a className="text-neo-primary underline" href="/auth/register">Create account</a>
          <a className="text-neo-primary underline" href="/auth/reset-request">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
