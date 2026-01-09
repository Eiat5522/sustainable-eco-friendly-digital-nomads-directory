'use client';

import { Mail, MessageSquare, Type } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { z } from 'zod';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
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
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'newsletter' ? 'newsletter' : 'general';
  const initialEmail = searchParams.get('email') || '';

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
    setEnquiryType(initialType);
    const emailFromSession = sessionStorage.getItem('newsletter-email');
    if (emailFromSession) {
      setEmail(emailFromSession);
      // Clear the email from sessionStorage after retrieval for privacy
      sessionStorage.removeItem('newsletter-email');
    } else {
      setEmail(initialEmail || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <NeoCard
          variant="elevated"
          className="max-w-2xl mx-auto"
          role="region"
          aria-labelledby="contact-heading"
        >
          <div className="p-8">
            <h1 id="contact-heading" className="heading-lg mb-2 text-neo-text-primary">
              Contact Us
            </h1>
            <p className="body-lg text-neo-text-secondary mb-8">
              We&apos;re here to help. Select a topic below or send us a message.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="enquiry-type" className="text-sm font-medium text-gray-700">
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
                    {/* The 'name' and 'email' fields were added to match the existing /api/contact endpoint's schema. */}
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
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
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
                      <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                        Subject
                      </Label>
                      <div className="relative mt-1">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                      <Label htmlFor="enquiry" className="text-sm font-medium text-gray-700">
                        Enquiry
                      </Label>
                      <div className="relative mt-1">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
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
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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

              <div className="flex items-center justify-end gap-4 mt-8">
                <Link href="/" passHref>
                  <NeoButton
                    variant="secondary"
                    type="button"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-900/40 dark:hover:bg-emerald-900/30"
                  >
                    Cancel
                  </NeoButton>
                </Link>
                <NeoButton
                  type="submit"
                  data-testid="contact-submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </NeoButton>
              </div>
            </form>
          </div>
        </NeoCard>
      </main>
      <Footer />
    </div>
  );
}

export default function ContactUsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactForm />
    </Suspense>
  );
}
