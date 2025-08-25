"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  id: number
  name: string
  role: string
  location: string
  avatar: string
  rating: number
  text: string
  venue: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Digital Marketing Specialist',
    location: 'Currently in Bali',
    avatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    text: 'This platform completely changed how I travel! Finding sustainable coworking spaces and eco-friendly accommodations has never been easier. The community reviews are spot-on.',
    venue: 'EcoWork Canggu'
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    role: 'Software Developer',
    location: 'Currently in Lisbon',
    avatar: 'https://i.pravatar.cc/150?img=2',
    rating: 5,
    text: 'As someone who cares deeply about environmental impact, this directory is a game-changer. Every venue I\'ve visited through this platform has exceeded my sustainability expectations.',
    venue: 'Green Bean Cafe'
  },
  {
    id: 3,
    name: 'Emma Thompson',
    role: 'UX Designer',
    location: 'Currently in Costa Rica',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 5,
    text: 'The quality of venues and the focus on sustainability is incredible. I love that I can travel guilt-free knowing I\'m supporting businesses that care about the planet.',
    venue: 'Bamboo Lodge'
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-6">What Nomads Say</h2>
          <p className="body-lg max-w-2xl mx-auto text-neo-text-secondary">
            Real experiences from digital nomads who are making a difference through sustainable travel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <NeoCard key={testimonial.id} variant="elevated" className="hover:shadow-[16px_16px_0px_0px] transition-all duration-300">
              <NeoCardContent className="p-8">
                {/* Quote Icon */}
                <div className="w-12 h-12 bg-neo-primary rounded-full flex items-center justify-center mb-6">
                  <Quote size={20} className="text-white" />
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  <span className="sr-only">{`${Math.round(testimonial.rating)} out of 5 stars`}</span>
                  {Array.from(
                    { length: Math.max(0, Math.min(5, Math.round(testimonial.rating))) }
                  ).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-neo-secondary fill-current"
                      aria-hidden="true"
                      focusable="false"
                    />
                  ))}
                  {/* Optional: render empty stars to keep width consistent */}
                  {/* {Array.from({ length: 5 - Math.max(0, Math.min(5, Math.round(testimonial.rating))) }).map((_, i) => (
                    <Star key={`empty-${i}`} size={16} className="text-neo-secondary/30" aria-hidden="true" focusable="false" />
                  ))} */}
                </div>

                {/* Testimonial Text */}
                <blockquote className="body-md mb-6 italic">
                  “{testimonial.text}”
                </blockquote>

                {/* Venue Badge */}
                <NeoBadge variant="success" size="sm" className="mb-6">
                  Visited: {testimonial.venue}
                </NeoBadge>

                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden neo-card">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />                  </div>
                  <div>
                    <h4 className="heading-sm">{testimonial.name}</h4>
                    <p className="body-sm text-neo-text-secondary">{testimonial.role}</p>
                    <p className="body-sm text-neo-text-secondary">{testimonial.location}</p>
                  </div>
                </div>
              </NeoCardContent>
            </NeoCard>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <NeoCard variant="flat" className="inline-block p-8 bg-gradient-to-r from-neo-secondary to-orange-400">
            <NeoCardContent>
              <h3 className="heading-md mb-4 text-white">Share Your Experience</h3>
              <p className="body-lg mb-6 text-white max-w-xl">
                Help fellow nomads by sharing your experiences with sustainable venues
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
<Link
  href="/write-review"
  className="neo-button neo-button-hover bg-neo-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-neo-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
>
  Write a Review
</Link>
<Link
  href="/community"
  className="neo-button neo-button-hover bg-transparent text-white border border-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-neo-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
>
  Join Community
</Link>
              </div>
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
    </section>
  )
}