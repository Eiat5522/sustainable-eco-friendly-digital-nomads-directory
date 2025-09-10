"use client";
import React, { useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';

export default function ResetPage() {
  const sp = useSearchParams();
  const token = sp.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const disabled = !token || password.length < 8 || password !== confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
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
        <h1 className="heading-lg mb-2">Set a new password</h1>
        {status === 'done' ? (
          <p className="body-md">Your password has been reset. You may now <a className="text-neo-primary underline" href="/auth/login">sign in</a>.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              className="w-full border-2 border-black rounded px-3 py-2"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <input
              className="w-full border-2 border-black rounded px-3 py-2"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
            <button className="w-full btn btn-primary" disabled={disabled || status === 'submitting'}>
              {status === 'submitting' ? 'Saving…' : 'Reset password'}
            </button>
            {status === 'error' && (
              <p className="text-sm text-red-600">Invalid or expired link. Request a new one.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}


