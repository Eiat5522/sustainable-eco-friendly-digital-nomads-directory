"use client";

import React from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-black rounded-xl bg-white p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        <h1 className="heading-lg mb-2">Sign in</h1>
        <p className="body-md text-neo-text-secondary mb-6">
          Choose a provider to continue
        </p>

        <div className="space-y-3">
          <button className="w-full btn btn-primary" onClick={() => signIn('google')}>Continue with Google</button>
          <button className="w-full btn btn-primary" onClick={() => signIn('facebook')}>Continue with Facebook</button>
          <button className="w-full btn btn-primary" onClick={() => signIn('twitter')}>Continue with X</button>
          <button className="w-full btn btn-primary" onClick={() => signIn('microsoft-entra-id')}>Continue with Microsoft</button>
        </div>

        <p className="text-xs text-neo-text-secondary mt-6">
          Note: Only configured providers will work in this environment.
        </p>
        <div className="mt-6 flex items-center justify-between text-sm">
          <a className="text-neo-primary underline" href="/auth/register">Create account</a>
          <a className="text-neo-primary underline" href="/auth/reset-request">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
