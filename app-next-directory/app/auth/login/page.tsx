"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import SocialAuthRow from '@/components/auth/SocialAuthRow';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError(res.error);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      {/* Background accents */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-neo-secondary/10 via-white to-neo-primary/10" />
      <div aria-hidden="true" className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neo-primary/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-neo-secondary/10 blur-3xl" />
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center p-8 rounded-xl neo-card bg-gradient-to-br from-white to-neo-secondary/5">
          <h2 className="heading-lg mb-3">Welcome back</h2>
          <p className="body-md">Log in to manage your listings, save favorites, and discover eco-friendly spots for digital nomads.</p>
          <div className="mt-8">
            <SocialAuthRow />
            <p className="sr-only">Social sign in options</p>
          </div>
        </div>

        {/* Auth card */}
        <NeoCard className="p-8 md:p-10">
          <NeoCardHeader>
            <NeoCardTitle>Log in</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <NeoButton type="submit" className="w-full">Login</NeoButton>
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
              New user?{' '}
              <Link href="/auth/signup" className="text-neo-primary hover:underline">Create an account</Link>
            </p>
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  );
}

