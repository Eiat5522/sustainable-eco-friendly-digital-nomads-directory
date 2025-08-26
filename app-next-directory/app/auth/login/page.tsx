'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';

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
          Login
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
            Sign in with {p.name}
          </NeoButton>
        ))}
      </div>
      <p className="mt-4 text-sm">
        New user?{' '}
        <Link href="/auth/signup" className="text-blue-600">
          Create an account
        </Link>
      </p>
    </div>
  );
}

