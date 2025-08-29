"use client";

import { signIn } from "next-auth/react";
import React from "react";

type Provider = {
  id: string;
  name: string;
  color: string; // background color
  fg?: string; // foreground color
  icon: React.ReactNode;
};

// Lightweight brand-ish icons (inline SVGs) to avoid new dependencies.
const Icons = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5">
      <path fill="#EA4335" d="M12 10.2v3.73h5.27c-.23 1.2-1.4 3.52-5.27 3.52-3.17 0-5.76-2.62-5.76-5.86S8.83 5.73 12 5.73c1.8 0 3.02.77 3.72 1.43l2.54-2.45C16.69 3.35 14.5 2.5 12 2.5 6.98 2.5 2.9 6.58 2.9 11.6S6.98 20.7 12 20.7c6.96 0 8.1-4.86 8.1-7.2 0-.49-.05-.83-.11-1.2H12z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
      <path fill="currentColor" d="M13.5 8.5V7.1c0-.62.41-1.02 1.03-1.02h1.47V3.5h-2.5c-2.07 0-3.5 1.44-3.5 3.6v1.4H8v2.6h1.99V20h3.01v-8.9h2.2l.3-2.6h-2.5z"/>
    </svg>
  ),
  twitterx: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
      <path fill="currentColor" d="M18.9 2.5h3.1l-6.78 7.75 7.96 11.25H17.3l-4.96-6.59-5.68 6.59H2.5l7.24-8.4L2 2.5h6.02l4.49 6.01 6.39-6.01z"/>
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
      <path fill="#F25022" d="M3 3h8v8H3z"/>
      <path fill="#7FBA00" d="M13 3h8v8h-8z"/>
      <path fill="#00A4EF" d="M3 13h8v8H3z"/>
      <path fill="#FFB900" d="M13 13h8v8h-8z"/>
    </svg>
  ),
};

const PROVIDERS: Provider[] = [
  { id: "facebook", name: "Facebook", color: "#1877F2", fg: "#FFFFFF", icon: Icons.facebook },
  { id: "twitter", name: "X", color: "#000000", fg: "#FFFFFF", icon: Icons.twitterx },
  { id: "microsoft", name: "Microsoft", color: "#F3F4F6", fg: "#111827", icon: Icons.microsoft },
  { id: "google", name: "Google", color: "#FFFFFF", fg: "#111827", icon: Icons.google },
];

export function SocialAuthRow({
  providers = PROVIDERS,
}: Readonly<{ providers?: Provider[] }>) {
  const [pending, setPending] = React.useState<string | null>(null);
  return (
    <div className="flex items-center justify-center gap-3">
      {providers.map((p) => (
        <button
          type="button"
          key={p.id}
          onClick={async () => {
            try {
              setPending(p.id);
              await signIn(p.id);
            } finally {
              // Probably navigates away, but safe fallback:
              setPending(null);
            }
          }}
          disabled={pending === p.id}
          aria-disabled={pending === p.id}
          title={`Continue with ${p.name}`}
          aria-label={`Continue with ${p.name}`}
          className="neo-button neo-button-hover rounded-full w-12 h-12 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
          style={{ backgroundColor: p.color, color: p.fg ?? '#111827' }}
        >
          {p.icon}
        </button>
      ))}
    </div>
  );
}

export default SocialAuthRow;

