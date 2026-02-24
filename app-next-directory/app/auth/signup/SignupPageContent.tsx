'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NeoButton } from '@/components/ui/neo-button';
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
      <div className="relative min-h-screen flex items-start justify-center px-4 py-12 bg-neo-primary overflow-hidden">
        {/* White dot grid on indigo background */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--neo-surface) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Floating shapes */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-neo-secondary border-4 border-neo-border shadow-[6px_6px_0px_0px] shadow-neo-shadow rotate-12 z-0" />
        <div className="absolute bottom-16 left-12 w-20 h-20 bg-neo-accent border-4 border-neo-border shadow-[5px_5px_0px_0px] shadow-neo-shadow rounded-full z-0 animate-[spin_14s_linear_infinite] motion-reduce:animate-none" />
        <div className="absolute top-1/3 left-6 w-14 h-14 bg-neo-success border-4 border-neo-border shadow-[4px_4px_0px_0px] shadow-neo-shadow -rotate-12 z-0" />
        <div className="absolute bottom-10 right-16 w-32 h-32 bg-neo-border border-4 border-neo-secondary rounded-full z-0" />

        <div
          className="relative z-10 w-full max-w-5xl flex flex-col gap-0 md:flex-row md:items-stretch border-4 border-neo-border bg-neo-surface overflow-hidden"
          style={{ boxShadow: '14px 14px 0px 0px var(--neo-shadow)' }}
        >
          {/* Left panel */}
          <div className="flex w-full flex-col justify-center bg-neo-success border-b-4 md:border-b-0 md:border-r-4 border-neo-border p-6 md:w-auto md:flex-1 md:p-8 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-neo-primary opacity-20 rounded-full" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-neo-secondary opacity-25 rotate-45" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-3xl" aria-hidden>🌿</span>
                <span className="font-bold text-neo-border text-sm uppercase tracking-[0.2em]">EcoNomad</span>
              </div>
              <h2 className="heading-xl text-neo-border uppercase tracking-tight mb-4">Create your<br />account</h2>
              <p className="body-md text-neo-border/80 mb-8 max-w-xs">
                Join our eco-forward community and explore sustainable places to live, work, and connect as a digital nomad.
              </p>
              <div className="border-2 border-neo-border bg-neo-surface p-5 shadow-[4px_4px_0px_0px] shadow-neo-shadow">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4 text-neo-text-primary">Quick Sign In</h3>
                <SocialAuthRow />
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="w-full bg-neo-surface p-8 md:w-auto md:flex-1 md:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-block bg-neo-success text-neo-border font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1 border-2 border-neo-border shadow-[3px_3px_0_0] shadow-neo-shadow mb-5">
                New Member
              </div>
              <h1 className="heading-lg mb-1">Sign Up</h1>
              <p className="body-sm">Create an account to start reviewing and saving listings.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <NeoInput
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                aria-label="Name"
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
                aria-label="Email"
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
                aria-label="Password"
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

            <div className="mt-6 pt-5 border-t-4 border-dashed border-neo-border text-center">
              <p className="body-sm">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="inline-block ml-1 px-3 py-1 bg-neo-primary text-white font-bold border-2 border-neo-border shadow-[2px_2px_0_0] shadow-neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase text-xs tracking-wider"
                >
                  Log in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignupPageContent;
