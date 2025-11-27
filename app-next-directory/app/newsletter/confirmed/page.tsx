'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';

function Content() {
  const params = useSearchParams();
  const status = params.get('status') || 'success';

  let title = 'Subscription Confirmed';
  let body = 'Thanks for confirming your subscription. You will start receiving updates soon.';
  let tone: 'success' | 'warning' | 'error' = 'success';

  if (status === 'invalid') {
    title = 'Invalid or Expired Link';
    body = 'The confirmation link is invalid or has expired. Please try subscribing again.';
    tone = 'error';
  } else if (status === 'missing') {
    title = 'Missing Token';
    body = 'No confirmation token was provided. Please try the link from your email again.';
    tone = 'warning';
  }

  const toneClasses = {
    success: 'border-neo-success text-neo-text-primary',
    warning: 'border-yellow-400 text-neo-text-primary',
    error: 'border-rose-400 text-neo-text-primary',
  }[tone];

  return (
    <main className="container mx-auto px-4 py-16">
      <NeoCard variant="elevated" className={`max-w-xl mx-auto ${toneClasses}`}>
        <div className="p-8">
          <h1 className="heading-lg mb-3">{title}</h1>
          <p className="body-md text-neo-text-secondary mb-8">{body}</p>
          <div className="flex justify-end gap-3">
            <NeoButton variant="secondary" asChild>
              <Link href="/">Go Home</Link>
            </NeoButton>
            <NeoButton asChild>
              <Link href="/contact-us?type=newsletter">Subscribe Again</Link>
            </NeoButton>
          </div>
        </div>
      </NeoCard>
    </main>
  );
}

export default function NewsletterConfirmedPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div>Loading confirmation...</div>}>
        <Content />
      </Suspense>
      <Footer />
    </div>
  );
}
