'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoButton } from '@/components/ui/neo-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Type } from 'lucide-react'
import Link from 'next/link'

type EnquiryType = 'general' | 'newsletter'

function ContactForm() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') === 'newsletter' ? 'newsletter' : 'general'
  const initialEmail = searchParams.get('email') || ''

  const [enquiryType, setEnquiryType] = useState<EnquiryType>(initialType)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [subject, setSubject] = useState('')
  const [enquiry, setEnquiry] = useState('')
  const [errors, setErrors] = useState({ name: '', email: '', subject: '', enquiry: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  useEffect(() => {
    setEnquiryType(initialType)
    setEmail(initialEmail)
  }, [initialType, initialEmail])

  const validate = () => {
    const newErrors = { name: '', email: '', subject: '', enquiry: '' }
    let isValid = true

    if (enquiryType === 'general') {
      if (!name.trim()) {
        newErrors.name = 'Name is required.'
        isValid = false
      }
      if (!email.trim()) {
        newErrors.email = 'Email is required.'
        isValid = false
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email is invalid.'
        isValid = false
      }
      if (!subject.trim()) {
        newErrors.subject = 'Subject is required.'
        isValid = false
      }
      if (!enquiry.trim()) {
        newErrors.enquiry = 'Enquiry is required.'
        isValid = false
      }
    } else { // newsletter
      if (!email.trim()) {
        newErrors.email = 'Email is required.'
        isValid = false
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email is invalid.'
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')

    let endpoint = ''
    let payload = {}

    if (enquiryType === 'general') {
      endpoint = '/api/contact'
      payload = {
        name,
        email,
        subject,
        message: enquiry,
        type: 'general',
      }
    } else { // newsletter
      endpoint = '/api/newsletter/subscribe'
      payload = { email }
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitMessage(result.message || 'Success!')
        // Reset form
        setName('')
        setEmail(initialEmail)
        setSubject('')
        setEnquiry('')
      } else {
        setSubmitMessage(result.message || 'An error occurred. Please try again.')
      }
    } catch (error) {
      setSubmitMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <NeoCard variant="flat" className="max-w-2xl mx-auto">
          <div className="p-8">
            <h1 className="heading-lg mb-2">Contact Us</h1>
            <p className="body-lg text-gray-600 mb-8">
              We&apos;re here to help. Select a topic below or send us a message.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="enquiry-type" className="text-sm font-medium text-gray-700">I have a question about...</Label>
                  <Select value={enquiryType} onValueChange={(value) => setEnquiryType(value as EnquiryType)}>
                    <SelectTrigger id="enquiry-type" className="w-full mt-1">
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
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <div className="relative mt-1">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <NeoInput
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                      {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>
                     <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <NeoInput
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10"
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</Label>
                      <div className="relative mt-1">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <NeoInput
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="e.g., Question about a venue"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                      {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject}</p>}
                    </div>
                    <div>
                      <Label htmlFor="enquiry" className="text-sm font-medium text-gray-700">Enquiry</Label>
                      <div className="relative mt-1">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <Textarea
                          id="enquiry"
                          name="enquiry"
                          placeholder="Please describe your enquiry in detail..."
                          value={enquiry}
                          onChange={(e) => setEnquiry(e.target.value)}
                          required
                          className="pl-10 pt-2"
                          rows={5}
                        />
                      </div>
                      {errors.enquiry && <p className="text-sm text-red-600 mt-1">{errors.enquiry}</p>}
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <NeoInput
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>
                )}
              </div>

              {submitMessage && (
                <div className={`mt-6 p-4 rounded-md text-center ${submitMessage.includes('Thank you') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {submitMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-4 mt-8">
                <Link href="/" passHref>
                  <NeoButton variant="secondary" type="button">
                    Cancel
                  </NeoButton>
                </Link>
                <NeoButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </NeoButton>
              </div>
            </form>
          </div>
        </NeoCard>
      </main>
      <Footer />
    </div>
  )
}

export default function ContactUsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactForm />
    </Suspense>
  )
}
