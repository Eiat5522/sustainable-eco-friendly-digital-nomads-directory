"use client";
import React, { useState } from 'react';

export default function ResetRequestPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus('error'); // consider a field-level validation message/state
      return;
    }
    if (status === 'submitting') return; // prevent double-submits
    setStatus('submitting');
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
     
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
           
      setStatus('sent');
   } catch (error) {
     console.error('Password reset request failed:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-black rounded-xl bg-white p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        <h1 className="heading-lg mb-2">Reset your password</h1>
        <p className="body-md text-neo-text-secondary mb-6">
          Enter your email and we’ll send a reset link.
        </p>
        {status === 'sent' ? (
          <p className="body-md">If an account exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              className="w-full border-2 border-black rounded px-3 py-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="w-full btn btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send reset link'}
            </button>
            {status === 'error' && (
              <p className="text-sm text-red-600">Something went wrong. Try again.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

