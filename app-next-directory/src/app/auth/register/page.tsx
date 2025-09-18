"use client";
import React, { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [requiresVerification, setRequiresVerification] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setStatus('submitting');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const message = await res.json().catch(() => ({}));
        throw new Error(message?.error || 'Registration failed');
      }
      const data = (await res.json().catch(() => ({}))) as { emailVerificationRequired?: boolean };
      setRequiresVerification(Boolean(data?.emailVerificationRequired));
      setStatus('success');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not create account. Try again.');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-black rounded-xl bg-white p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        <h1 className="heading-lg mb-2">Create your account</h1>
        {status === 'success' ? (
          <div className="space-y-3">
            {requiresVerification ? (
              <p className="body-md">Check your inbox to verify your email before signing in.</p>
            ) : (
              <div className="space-y-2">
                <p className="body-md">Your account is ready.</p>
                <p className="text-sm text-neo-text-secondary">You can sign in right away with the credentials you just created.</p>
              </div>
            )}
            <a className="text-neo-primary underline" href="/auth/login">Return to sign in</a>
          </div>
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
            {serverError && (
              <p className="text-sm text-red-600" role="alert">{serverError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
