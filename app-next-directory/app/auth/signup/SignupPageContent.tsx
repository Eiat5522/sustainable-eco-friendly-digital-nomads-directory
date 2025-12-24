'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { NeoInput } from '@/components/ui/neo-input';

export function SignupPageContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message || 'Failed to sign up');
      return;
    }
    await signIn('credentials', { email, password, callbackUrl: '/' });
  };

  return (
    <>
      <Header />
      <div className="relative min-h-screen flex items-start justify-center px-4 py-12">
        {/* Background accents */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neo-secondary/10 via-white to-neo-primary/10" />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neo-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-neo-secondary/10 blur-3xl" />

        <div className="w-full max-w-5xl flex flex-col gap-8 md:flex-row md:items-stretch">
          {/* Left panel (visible on all sizes; stacks above auth card on mobile) */}
          <div className="flex w-full flex-col justify-center rounded-xl neo-card bg-gradient-to-br from-white to-neo-secondary/5 p-6 md:w-auto md:flex-1 md:p-8">
            <h2 className="heading-lg mb-3">Create your account</h2>
            <p className="body-md">
              Join our eco-forward community and explore sustainable places to live, work, and
              connect as a digital nomad.
            </p>
            <div className="mt-8">
              <SocialAuthRow />
            </div>
          </div>

          {/* Auth card */}
          <NeoCard className="w-full p-8 md:w-auto md:flex-1 md:p-10">
            <NeoCardHeader>
              <NeoCardTitle>Sign Up</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-neo-text-secondary">
                  Create an account to start reviewing and saving listings.
                </p>
                <NeoInput
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Name"
                  autoComplete="name"
                  autoFocus
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <NeoInput
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <NeoInput
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {error && (
                  <p
                    className="text-red-500 text-sm"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                  >
                    {error}
                  </p>
                )}
                <NeoButton type="submit" className="w-full">
                  Sign Up
                </NeoButton>
              </form>

              <p className="mt-6 text-sm text-center">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-neo-primary hover:underline focus-visible:underline underline-offset-2"
                >
                  Log in
                </Link>
              </p>

              {/* Social sign-in is shown in the left panel to avoid duplication */}
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignupPageContent;
