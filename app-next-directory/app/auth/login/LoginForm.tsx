'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { sanitizeCallbackUrl } from '@/lib/auth/callbackUrl';
import { structuredLogger } from '@/lib/logger';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sanitizedCallbackUrl = useMemo(() => {
    const raw = searchParams.get('callbackUrl');
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    return sanitizeCallbackUrl(raw, origin);
  }, [searchParams]);

  const callbackUrl = sanitizedCallbackUrl ?? '/';

  // Map NextAuth error codes from querystring to user-friendly messages
  const queryError = useMemo(() => {
    const e = searchParams.get('error');
    if (!e) return '';
    switch (e) {
      case 'CredentialsSignin':
        return 'Invalid email or password.';
      case 'OAuthAccountNotLinked':
        return 'This email is linked to a different sign-in method. Sign in with the original provider or reset your password.';
      case 'AccessDenied':
        return 'Access denied. Please try again or contact support.';
      case 'Configuration':
        return 'Auth configuration issue. Please try again later.';
      default:
        return 'Unable to sign in. Please try again.';
    }
  }, [searchParams]);

  useEffect(() => {
    if (queryError) setError(queryError);
  }, [queryError]);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const emailRegex = /.+@.+\..+/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }
    if (!trimmedPassword || trimmedPassword.length < 8) {
      setPasswordError('Enter your password (min 8 characters).');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(
          res.error === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : 'Unable to sign in. Please try again.'
        );
        return;
      }
      // Prefer router navigation if a URL is present
      if (res?.url) {
        const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
        const safeUrl = sanitizeCallbackUrl(res.url, origin);
        if (safeUrl) router.replace(safeUrl);
        else if (res.url) window.location.href = res.url;
        else router.replace(callbackUrl);
      } else {
        router.replace(callbackUrl);
      }
    } catch (err) {
      structuredLogger.error('Login error', err, { component: 'auth' });
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-describedby={error ? 'form-error' : undefined}
      >
        <NeoInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email"
          disabled={isLoading}
          aria-disabled={isLoading}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError ? (
          <p id="email-error" className="text-red-500 text-xs" aria-live="polite">
            {emailError}
          </p>
        ) : null}
        <NeoInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          aria-label="Password"
          disabled={isLoading}
          aria-disabled={isLoading}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? 'password-error' : undefined}
        />
        {passwordError ? (
          <p id="password-error" className="text-red-500 text-xs" aria-live="polite">
            {passwordError}
          </p>
        ) : null}
        {error ? (
          <p id="form-error" role="alert" aria-live="polite" className="text-red-500 text-sm">
            {error}
          </p>
        ) : null}
        <NeoButton
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-disabled={isLoading}
          data-testid="login-button"
        >
          {isLoading ? 'Signing in…' : 'Login'}
        </NeoButton>
      </form>

      <section className="mt-6" aria-labelledby="social-signin-heading">
        <div className="relative flex items-center">
          <div className="flex-1 h-px bg-neo-border" />
          <span id="social-signin-heading" className="px-3 text-xs text-neo-text-secondary">
            or continue with
          </span>
          <div className="flex-1 h-px bg-neo-border" />
        </div>
        <div className="mt-4">
          <SocialAuthRow />
        </div>
      </section>
    </div>
  );
}
