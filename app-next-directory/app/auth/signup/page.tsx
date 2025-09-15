"use client";

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/');

  useEffect(() => {
    const callback = searchParams.get('callbackUrl');
    if (callback) {
      setCallbackUrl(callback);
    }
  }, [searchParams]);

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required.');
      isValid = false;
    }

    // Validate email
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    }

    // Validate password confirmation
    if (!confirmPassword) {
      setConfirmPasswordError('Password confirmation is required.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 409) {
          setError('An account with this email already exists.');
        } else {
          setError(data?.error?.message || 'Failed to sign up. Please try again.');
        }
        return;
      }
      
      // After successful signup, sign in the user
      const signInResult = await signIn('credentials', { 
        email: email.trim().toLowerCase(), 
        password, 
        redirect: false,
        callbackUrl 
      });
      
      if (signInResult?.error) {
        setError('Account created but failed to sign in. Please try logging in manually.');
        return;
      }
      
      // Redirect to callback URL or default
      if (signInResult?.url) {
        router.replace(signInResult.url);
      } else {
        router.replace(callbackUrl);
      }
    } catch (err) {
      console.error('Signup failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background accents */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neo-secondary/10 via-white to-neo-primary/10" />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neo-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-neo-secondary/10 blur-3xl" />

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left panel */}
          <div className="hidden md:flex flex-col justify-center p-8 rounded-xl neo-card bg-gradient-to-br from-white to-neo-secondary/5">
            <h2 className="heading-lg mb-3" id="welcome-heading">Create your account</h2>
            <p className="body-md">Join our eco-forward community and explore sustainable places to live, work, and connect as a digital nomad.</p>
            <div className="mt-8" aria-labelledby="social-signin-heading-left">
              <h3 id="social-signin-heading-left" className="sr-only">Social sign-up options</h3>
              <SocialAuthRow />
            </div>
          </div>

          {/* Auth card */}
          <NeoCard className="p-8 md:p-10">
            <NeoCardHeader>
              <NeoCardTitle>Sign Up</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "form-error" : undefined}>
                <NeoInput
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Full Name"
                  autoComplete="name"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  aria-disabled={isLoading}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "name-error" : undefined}
                  aria-label="Full Name"
                />
                {nameError && (
                  <p id="name-error" className="text-red-500 text-xs" aria-live="polite">{nameError}</p>
                )}

                <NeoInput
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  aria-disabled={isLoading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  aria-label="Email"
                />
                {emailError && (
                  <p id="email-error" className="text-red-500 text-xs" aria-live="polite">{emailError}</p>
                )}

                <NeoInput
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Password (min 8 characters)"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  aria-disabled={isLoading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  aria-label="Password"
                />
                {passwordError && (
                  <p id="password-error" className="text-red-500 text-xs" aria-live="polite">{passwordError}</p>
                )}

                <NeoInput
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  aria-disabled={isLoading}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                  aria-label="Confirm Password"
                />
                {confirmPasswordError && (
                  <p id="confirm-password-error" className="text-red-500 text-xs" aria-live="polite">{confirmPasswordError}</p>
                )}

                {error && (
                  <p id="form-error" role="alert" aria-live="assertive" aria-atomic="true" className="text-red-500 text-sm">
                    {error}
                  </p>
                )}

                <NeoButton type="submit" className="w-full" disabled={isLoading} aria-disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </NeoButton>
              </form>

              <div className="mt-6 md:hidden" aria-labelledby="social-signin-heading-mobile">
                <div className="relative flex items-center">
                  <div className="flex-1 h-px bg-neo-border" />
                  <span id="social-signin-heading-mobile" className="px-3 text-xs text-neo-text-secondary">or continue with</span>
                  <div className="flex-1 h-px bg-neo-border" />
                </div>
                <div className="mt-4">
                  <SocialAuthRow />
                </div>
              </div>

              <p className="mt-6 text-sm text-center">
                Already have an account?{' '}
                <Link
                  href={`/auth/login${callbackUrl && callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                  className="text-neo-primary hover:underline focus-visible:underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
      <Footer />
    </>
  );
}

