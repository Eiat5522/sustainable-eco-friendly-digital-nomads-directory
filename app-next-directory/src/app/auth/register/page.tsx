"use client";
import React, { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error('bad');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-black rounded-xl bg-white p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        <h1 className="heading-lg mb-2">Create your account</h1>
        {status === 'done' ? (
          <p className="body-md">Check your inbox to verify your email before signing in.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
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
            <button className="w-full btn btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Creating…' : 'Create account'}
            </button>
            {status === 'error' && (
              <p className="text-sm text-red-600">Could not create account. Try again.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

