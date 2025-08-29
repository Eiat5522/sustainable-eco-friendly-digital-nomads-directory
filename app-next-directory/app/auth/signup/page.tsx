"use client";

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import SocialAuthRow from '@/components/auth/SocialAuthRow';

export default function SignupPage() {
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
    <div className="relative min-h-screen flex items-center justify-center px-4">
      {/* Background accents */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neo-secondary/10 via-white to-neo-primary/10" />
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neo-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-neo-secondary/10 blur-3xl" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center p-8 rounded-xl neo-card bg-gradient-to-br from-white to-neo-secondary/5">
          <h2 className="heading-lg mb-3">Create your account</h2>
          <p className="body-md">Join our eco-forward community and explore sustainable places to live, work, and connect as a digital nomad.</p>
          <div className="mt-8">
            <SocialAuthRow />
          </div>
        </div>

        {/* Auth card */}
        <NeoCard className="p-8 md:p-10">
          <NeoCardHeader>
            <NeoCardTitle>Sign Up</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <NeoInput
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <NeoInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <NeoInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <p className="text-red-500 text-sm" role="alert" aria-live="polite">
                  {error}
                </p>
              )}
              <NeoButton type="submit" className="w-full">Sign Up</NeoButton>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center">
                <div className="flex-1 h-px bg-neo-border" />
                <span className="px-3 text-xs text-neo-text-secondary">or continue with</span>
                <div className="flex-1 h-px bg-neo-border" />
              </div>
              <div className="mt-4">
                <SocialAuthRow />
              </div>
            </div>

            <p className="mt-6 text-sm text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-neo-primary hover:underline">Log in</Link>
            </p>
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  );
}

