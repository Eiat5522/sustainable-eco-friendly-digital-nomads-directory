"use client";

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, UserCheck, Shield } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'admin'>('signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const rawCallbackUrl = searchParams?.get('callbackUrl') ?? undefined;
  const adminMode = searchParams?.get('admin') === 'true';

  // Initialize admin mode if URL parameter is present
  React.useEffect(() => {
    if (adminMode) {
      setAuthMode('admin');
    }
  }, [adminMode]);

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

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    setErrorMessage('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setSubmitStatus('error');
        setErrorMessage('Invalid email or password. Please try again.');
      } else {
        setSubmitStatus('done');
        // Redirect to callback URL or admin dashboard for admin users
        const redirectUrl = callbackUrl || (authMode === 'admin' ? '/admin' : '/dashboard');
        router.push(redirectUrl);
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('An error occurred during sign in. Please try again.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setSubmitStatus('error');
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      setSubmitStatus('done');
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Could not create account. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const switchMode = (mode: 'signup' | 'login' | 'admin') => {
    setAuthMode(mode);
    setSubmitStatus('idle');
    setErrorMessage('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const getModeConfig = () => {
    switch (authMode) {
      case 'admin':
        return {
          title: 'Admin Sign In',
          description: 'Access the admin dashboard',
          icon: <Shield className="h-6 w-6 text-orange-600" />,
          color: 'border-orange-500 bg-orange-50',
          buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white'
        };
      case 'login':
        return {
          title: 'Welcome back',
          description: 'Sign in to your account',
          icon: <UserCheck className="h-6 w-6 text-blue-600" />,
          color: 'border-blue-500 bg-blue-50',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      default:
        return {
          title: 'Create your account',
          description: 'Join our community',
          icon: <UserCheck className="h-6 w-6 text-green-600" />,
          color: 'border-green-500 bg-green-50',
          buttonColor: 'bg-green-600 hover:bg-green-700 text-white'
        };
    }
  };

  const config = getModeConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-black rounded-xl bg-white p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        {/* Mode Toggle */}
        <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              authMode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              authMode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode('admin')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              authMode === 'admin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Header */}
        <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${config.color}`}>
          {config.icon}
          <div>
            <h1 className="text-lg font-semibold">{config.title}</h1>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Signed in successfully</p>
              <p className="text-sm text-emerald-700">
                You're signed in as {displayName}. {callbackUrl ? 'You can head back to your previous page.' : 'Feel free to continue exploring.'}
              </p>
            </div>
          </div>
        )}

        {submitStatus === 'done' && authMode === 'signup' ? (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Account created successfully!</p>
            <p className="text-gray-600 mb-4">Check your inbox to verify your email before signing in.</p>
            <button
              onClick={() => switchMode('login')}
              className="text-blue-600 underline hover:text-blue-800"
            >
              Sign in now
            </button>
          </div>
        ) : (
          <>
            {/* Credentials Form */}
            <form onSubmit={authMode === 'signup' ? handleSignup : handleCredentialsSignIn} className="space-y-4 mb-6">
              {authMode === 'signup' && (
                <input
                  className="w-full border-2 border-black rounded px-3 py-2"
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              )}
              <input
                className="w-full border-2 border-black rounded px-3 py-2"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <input
                className="w-full border-2 border-black rounded px-3 py-2"
                type="password"
                name="password"
                placeholder="Password (min 8 chars)"
                value={formData.password}
                onChange={handleInputChange}
                minLength={8}
                required
              />
              {authMode === 'signup' && (
                <input
                  className="w-full border-2 border-black rounded px-3 py-2"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  minLength={8}
                  required
                />
              )}
              <button
                className={`w-full py-2 px-4 rounded font-medium transition-colors ${config.buttonColor}`}
                disabled={submitStatus === 'submitting' || isAuthenticated}
                type="submit"
              >
                {submitStatus === 'submitting' 
                  ? (authMode === 'signup' ? 'Creating...' : 'Signing in...') 
                  : (authMode === 'signup' ? 'Create account' : 'Sign in')
                }
              </button>
              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
            </form>

            {/* OAuth Providers */}
            {authMode !== 'admin' && (
              <>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

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

                <p className="text-xs text-gray-500 mt-4">
                  Note: Only configured providers will work in this environment.
                </p>
              </>
            )}
          </>
        )}

        {/* Footer Links */}
        <div className="mt-6 flex items-center justify-between text-sm">
          {authMode === 'admin' ? (
            <Link className="text-blue-600 underline" href="/auth/register">Back to regular login</Link>
          ) : (
            <Link className="text-blue-600 underline" href="/auth/reset-request">Forgot password?</Link>
          )}
          <Link className="text-blue-600 underline" href="/auth/register?admin=true">Admin access</Link>
        </div>
      </div>
    </div>
  );
}

