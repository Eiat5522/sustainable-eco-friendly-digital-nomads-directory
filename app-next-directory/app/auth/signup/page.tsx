'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';

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

  const socialProviders = [
    { id: 'facebook', name: 'Facebook' },
    { id: 'twitter', name: 'X' },
    { id: 'microsoft', name: 'Hotmail' },
    { id: 'google', name: 'Gmail' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <NeoButton type="submit" className="w-full">
          Sign Up
        </NeoButton>
      </form>
      <div className="mt-6 space-y-2 w-full max-w-md">
        {socialProviders.map((p) => (
          <NeoButton
            key={p.id}
            variant="outline"
            className="w-full"
            onClick={() => signIn(p.id)}
          >
            Continue with {p.name}
          </NeoButton>
        ))}
      </div>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-600">
          Log in
        </Link>
      </p>
    </div>
  );
}

