"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Shield, User, UserPlus } from 'lucide-react';
import SocialAuthRow from '@/components/auth/SocialAuthRow';

type AuthMode = 'signin' | 'signup' | 'admin';

export default function UnifiedAuthPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams?.get('callbackUrl') ?? undefined;
  
  // Get initial mode from URL params, default to signin
  const initialMode = (searchParams?.get('mode') as AuthMode) || 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Sign up form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [requiresVerification, setRequiresVerification] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  // Honor global kill switch for OAuth providers (matches SocialAuthRow behavior)
  const OAUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH === 'true';

  const onSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSignupStatus('submitting');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const message = await res.json().catch(() => ({}));
        throw new Error(message?.error || 'Registration failed');
      }
      const data = (await res.json().catch(() => ({}))) as { emailVerificationRequired?: boolean };
      setRequiresVerification(Boolean(data?.emailVerificationRequired));
      setSignupStatus('success');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not create account. Try again.');
      setSignupStatus('idle');
    }
  };

  const getModeConfig = (currentMode: AuthMode) => {
    switch (currentMode) {
      case 'admin':
        return {
          title: 'Admin Access',
          subtitle: 'Sign in with administrative privileges',
          icon: <Shield className="h-5 w-5" />,
          borderColor: 'border-orange-500',
          bgColor: 'bg-orange-50',
          shadowColor: 'shadow-[12px_12px_0_0_rgba(249,115,22,1)]',
          buttonColor: 'bg-orange-500 hover:bg-orange-600',
          accentColor: 'text-orange-600'
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Join our eco-friendly community',
          icon: <UserPlus className="h-5 w-5" />,
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50',
          shadowColor: 'shadow-[12px_12px_0_0_rgba(34,197,94,1)]',
          buttonColor: 'bg-green-500 hover:bg-green-600',
          accentColor: 'text-green-600'
        };
      default: // signin
        return {
          title: 'Sign In',
          subtitle: 'Welcome back to SustainableNomads',
          icon: <User className="h-5 w-5" />,
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
          shadowColor: 'shadow-[12px_12px_0_0_rgba(59,130,246,1)]',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
          accentColor: 'text-blue-600'
        };
    }
  };

  const config = getModeConfig(mode);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className={`w-full max-w-md border-4 ${config.borderColor} rounded-xl ${config.bgColor} p-6 ${config.shadowColor}`}>
        {/* Mode Toggle Buttons */}
        <div className="flex rounded-lg bg-white p-1 mb-6 border-2 border-black">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="h-4 w-4" />
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Sign Up
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'admin'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 ${config.accentColor} mb-2`}>
            {config.icon}
            <h1 className="heading-lg">{config.title}</h1>
          </div>
          <p className="body-md text-neo-text-secondary">
            {config.subtitle}
          </p>
        </div>

        {/* Success Message for Authenticated Users */}
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

        {/* Form Content */}
        {mode === 'signup' && signupStatus === 'success' ? (
          // Sign Up Success State
          <div className="space-y-3">
            {requiresVerification ? (
              <p className="body-md">Check your inbox to verify your email before signing in.</p>
            ) : (
              <div className="space-y-2">
                <p className="body-md">Your account is ready.</p>
                <p className="text-sm text-neo-text-secondary">You can sign in right away with the credentials you just created.</p>
              </div>
            )}
            <button 
              onClick={() => setMode('signin')}
              className={`w-full ${config.buttonColor} text-white py-2 px-4 rounded-md font-medium`}
            >
              Go to Sign In
            </button>
          </div>
        ) : mode === 'signup' ? (
          // Sign Up Form
          <form onSubmit={onSignupSubmit} className="space-y-4">
            <input
              className="w-full border-2 border-black rounded px-3 py-2"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full border-2 border-black rounded px-3 py-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border-2 border-black rounded px-3 py-2"
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button 
              className={`w-full ${config.buttonColor} text-white py-2 px-4 rounded-md font-medium`}
              disabled={signupStatus === 'submitting'}
            >
              {signupStatus === 'submitting' ? 'Creating…' : 'Create account'}
            </button>
            {serverError && (
              <p className="text-sm text-red-600" role="alert">{serverError}</p>
            )}
          </form>
        ) : (
          // Sign In Form (includes admin mode)
          <>
            {mode === 'admin' && (
              <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Admin Access:</strong> Use your administrator credentials to access the admin dashboard.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <input
                className="w-full border-2 border-black rounded px-3 py-2"
                type="email"
                placeholder="Email"
                required
              />
              <input
                className="w-full border-2 border-black rounded px-3 py-2"
                type="password"
                placeholder="Password"
                required
              />
              <button className={`w-full ${config.buttonColor} text-white py-2 px-4 rounded-md font-medium`}>
                {mode === 'admin' ? 'Access Admin Dashboard' : 'Sign In'}
              </button>
            </div>
          </>
        )}

        {/* Social Auth Section */}
        {(mode === 'signin' || mode === 'admin') && (
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            {OAUTH_DISABLED ? (
              <div className="text-sm text-neo-text-secondary text-center">
                Social sign-in is temporarily disabled.
              </div>
            ) : (
              <SocialAuthRow />
            )}
          </div>
        )}

        {/* Footer Links */}
        {mode === 'signin' && (
          <div className="mt-6 flex items-center justify-center text-sm">
            <a className="text-neo-primary underline" href="/auth/reset-request">Forgot password?</a>
          </div>
        )}

        {!OAUTH_DISABLED && mode !== 'signup' && (
          <p className="text-xs text-neo-text-secondary mt-6 text-center">
            Note: Only configured providers will work in this environment.
          </p>
        )}
      </div>
    </div>
  );
}