/**
 * Newsletter Form Client Component
 *
 * Client-side interactive component for the newsletter subscription form.
 * Isolated as a client island to keep the Footer server-rendered.
 */

'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoInput } from '@/components/ui/neo-input';
import { structuredLogger } from '@/lib/logger';

export function NewsletterForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [errors, setErrors] = React.useState({ email: '' });

  return (
    <NeoCard variant="flat" className="mb-16 bg-neo-primary border-white">
      <div className="p-8 text-center">
        <h3 className="heading-md mb-4 text-white">Stay Updated on Sustainable Travel</h3>
        <p className="body-lg mb-6 text-blue-100 max-w-2xl mx-auto">
          Get weekly updates on new sustainable venues, eco-travel tips, and nomad community
          highlights
        </p>
        <form
          className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          onSubmit={e => {
            e.preventDefault();
            const trimmed = email.trim();
            const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
            if (!isValid) {
              setErrors({ email: 'Please enter a valid email address.' });
              return;
            }
            setErrors({ email: '' });
            // Store email in sessionStorage to avoid exposing PII in URL
            try {
              sessionStorage.setItem('newsletter-email', trimmed);
            } catch (error) {
              structuredLogger.warn('Failed to store email in sessionStorage:', error);
            }
            router.push('/contact-us?type=newsletter');
          }}
        >
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Email address
          </label>
          <NeoInput
            id="footer-newsletter-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby="newsletter-help"
            aria-errormessage="newsletter-error"
            required
            className="flex-1 bg-white text-neo-text-primary"
          />
          {errors.email && (
            <p id="newsletter-error" className="text-red-500 text-sm mt-1" role="alert">
              {errors.email}
            </p>
          )}
          <NeoButton type="submit" variant="secondary" size="md">
            Subscribe
          </NeoButton>
        </form>
        <p id="newsletter-help" className="sr-only">
          We send occasional updates. Unsubscribe anytime.
        </p>
      </div>
    </NeoCard>
  );
}
