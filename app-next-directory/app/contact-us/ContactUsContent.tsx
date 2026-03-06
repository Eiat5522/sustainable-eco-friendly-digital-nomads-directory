'use client';

import { Mail, MessageSquare, Type } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoInput } from '@/components/ui/neo-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type EnquiryType = 'general' | 'newsletter';

const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .refine(
    value => !/[\r\n]/.test(value) && !/%0a|%0d/i.test(value),
    'Please enter a valid email address'
  );

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message too long'),
});

const newsletterSchema = z.object({
  email: emailSchema,
});

function ContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = useMemo(
    () => (searchParams.get('type') === 'newsletter' ? 'newsletter' : 'general'),
    [searchParams]
  );
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [enquiryType, setEnquiryType] = useState<EnquiryType>(initialType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState('');
  const [enquiry, setEnquiry] = useState('');
  const [errors, setErrors] = useState<z.ZodError['formErrors']['fieldErrors']>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const emailFromSession = sessionStorage.getItem('newsletter-email');
    if (emailFromSession) {
      setEmail(emailFromSession);
      sessionStorage.removeItem('newsletter-email');
    } else {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (enquiryType !== initialType && initialType) {
      setEnquiryType(initialType);
    }
  }, [initialType, enquiryType]);

  const validate = () => {
    const schema = enquiryType === 'general' ? contactFormSchema : newsletterSchema;
    const data = enquiryType === 'general' ? { name, email, subject, message: enquiry } : { email };
    const result = schema.safeParse(data);

    if (!result.success) {
      setErrors(result.error.formErrors.fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus(null);

    let endpoint = '';
    let payload = {};

    if (enquiryType === 'general') {
      endpoint = '/api/contact';
      payload = {
        name,
        email,
        subject,
        message: enquiry,
        type: 'general',
      };
    } else {
      // newsletter
      endpoint = '/api/newsletter/subscribe';
      payload = { email };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage(result.message || 'Success!');
        setSubmitStatus('success');
        // Reset form
        setName('');
        setEmail(initialEmail);
        setSubject('');
        setEnquiry('');
      } else {
        setSubmitMessage(result.message || 'An error occurred. Please try again.');
        setSubmitStatus('error');
      }
    } catch (_error) {
      setSubmitMessage('An error occurred. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neo-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-surface) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute right-8 top-10 z-0 h-24 w-24 rotate-12 border-4 border-neo-border bg-neo-secondary shadow-[6px_6px_0_0] shadow-neo-shadow" />
      <div className="pointer-events-none absolute bottom-12 left-10 z-0 h-20 w-20 rounded-full border-4 border-neo-border bg-neo-accent shadow-[6px_6px_0_0] shadow-neo-shadow" />
      <div className="pointer-events-none absolute bottom-10 right-16 z-0 h-32 w-32 rounded-full border-4 border-neo-secondary bg-neo-border opacity-40" />
      <main className="container relative z-10 mx-auto px-4 py-12 md:py-16">
        <NeoCard
          variant="elevated"
          className="mx-auto max-w-5xl overflow-hidden border-4 border-neo-border"
        >
          <div className="grid md:grid-cols-5">
            <section className="relative border-b-4 border-neo-border bg-neo-success p-6 md:col-span-2 md:border-b-0 md:border-r-4 md:p-8">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-neo-primary opacity-20" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rotate-45 bg-neo-secondary opacity-25" />
              <div className="relative z-10">
                <div className="mb-4 inline-block border-2 border-neo-border bg-neo-surface px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-[3px_3px_0_0] shadow-neo-shadow">
                  Support Desk
                </div>
                <h1 id="contact-heading" className="heading-lg mb-3 text-neo-border">
                  Contact Us
                </h1>
                <p className="mb-8 text-sm font-semibold leading-relaxed text-neo-border/80">
                  Questions, partnerships, or newsletter updates. Send us a message and we&apos;ll
                  get back to you soon.
                </p>
                <div className="border-2 border-neo-border bg-neo-surface p-4 shadow-[4px_4px_0_0] shadow-neo-shadow">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-neo-text-primary">
                    Typical response time
                  </p>
                  <p className="mt-2 text-sm font-semibold text-neo-text-secondary">
                    Within 1-2 business days
                  </p>
                </div>
              </div>
            </section>

            <section
              className="bg-neo-surface p-6 md:col-span-3 md:p-8"
              aria-labelledby="contact-heading"
            >
              <p className="mb-6 inline-block border-2 border-neo-border bg-neo-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[3px_3px_0_0] shadow-neo-shadow">
                Let&apos;s Talk
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label
                      htmlFor="enquiry-type"
                      className="text-sm font-bold uppercase tracking-wider"
                    >
                      I have a question about...
                    </Label>
                    <Select
                      value={enquiryType}
                      onValueChange={(value: EnquiryType) => setEnquiryType(value)}
                    >
                      <SelectTrigger
                        id="enquiry-type"
                        aria-label="Select enquiry type"
                        className="w-full mt-1"
                      >
                        <SelectValue placeholder="Select an enquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Enquiry</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {enquiryType === 'general' ? (
                    <>
                      <div>
                        <Label
                          htmlFor="name"
                          className="text-sm font-bold uppercase tracking-wider"
                        >
                          Full Name
                        </Label>
                        <div className="relative mt-1">
                          <Type
                            aria-hidden="true"
                            focusable="false"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                          />
                          <NeoInput
                            data-testid="contact-name"
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="pl-10"
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'name-error' : undefined}
                          />
                        </div>
                        {errors.name && (
                          <p
                            id="name-error"
                            data-testid="name-error"
                            role="alert"
                            className="text-sm text-red-600 mt-1"
                          >
                            {errors.name[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="email"
                          className="text-sm font-bold uppercase tracking-wider"
                        >
                          Email Address
                        </Label>
                        <div className="relative mt-1">
                          <Mail
                            aria-hidden="true"
                            focusable="false"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                          />
                          <NeoInput
                            data-testid="contact-email"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="pl-10"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="email"
                            enterKeyHint="send"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                          />
                        </div>
                        {errors.email && (
                          <p
                            id="email-error"
                            data-testid="email-error"
                            role="alert"
                            className="text-sm text-red-600 mt-1"
                          >
                            {errors.email[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="subject"
                          className="text-sm font-bold uppercase tracking-wider"
                        >
                          Subject
                        </Label>
                        <div className="relative mt-1">
                          <Type
                            aria-hidden="true"
                            focusable="false"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                          />
                          <NeoInput
                            data-testid="contact-subject"
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder="e.g., Question about a venue"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                            className="pl-10"
                            aria-invalid={!!errors.subject}
                            aria-describedby={errors.subject ? 'subject-error' : undefined}
                          />
                        </div>
                        {errors.subject && (
                          <p
                            id="subject-error"
                            data-testid="subject-error"
                            role="alert"
                            className="text-sm text-red-600 mt-1"
                          >
                            {errors.subject[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="enquiry"
                          className="text-sm font-bold uppercase tracking-wider"
                        >
                          Enquiry
                        </Label>
                        <div className="relative mt-1">
                          <MessageSquare
                            aria-hidden="true"
                            focusable="false"
                            className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                          />
                          <Textarea
                            data-testid="contact-message"
                            id="enquiry"
                            name="enquiry"
                            placeholder="Please describe your enquiry in detail..."
                            value={enquiry}
                            onChange={e => setEnquiry(e.target.value)}
                            required
                            className="pl-10 pt-2"
                            rows={5}
                            aria-invalid={!!errors.message}
                            aria-describedby={errors.message ? 'enquiry-error' : undefined}
                          />
                        </div>
                        {errors.message && (
                          <p
                            id="enquiry-error"
                            data-testid="message-error"
                            role="alert"
                            className="text-sm text-red-600 mt-1"
                          >
                            {errors.message[0]}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wider">
                        Email Address
                      </Label>
                      <div className="relative mt-1">
                        <Mail
                          aria-hidden="true"
                          focusable="false"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        />
                        <NeoInput
                          data-testid="contact-email"
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          className="pl-10"
                          autoComplete="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          inputMode="email"
                          enterKeyHint="send"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                      </div>
                      {errors.email && (
                        <p
                          id={'email-error'}
                          data-testid="email-error"
                          role="alert"
                          className="text-sm text-red-600 mt-1"
                        >
                          {errors.email[0]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {submitMessage && (
                  <output
                    data-testid={submitStatus === 'success' ? 'contact-success' : 'contact-error'}
                    aria-live="polite"
                    className={`mt-6 p-4 rounded-md text-center border ${submitStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
                  >
                    {submitMessage}
                  </output>
                )}

                <div className="mt-8 flex items-center justify-end gap-4 border-t-4 border-dashed border-neo-border pt-6">
                  <NeoButton variant="secondary" type="button" onClick={() => router.push('/')}>
                    Cancel
                  </NeoButton>
                  <NeoButton
                    type="submit"
                    data-testid="contact-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="bg-neo-primary text-white hover:bg-neo-primary/90"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </NeoButton>
                </div>
              </form>
            </section>
          </div>
        </NeoCard>
      </main>
    </div>
  );
}

export function ContactUsContent() {
  return <ContactForm />;
}
