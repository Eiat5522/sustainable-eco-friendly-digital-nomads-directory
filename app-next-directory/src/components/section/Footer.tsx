"use client"

import React from 'react'
import Link from 'next/link'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoCard } from '@/components/ui/neo-card'
import { Leaf, Twitter, Instagram, Linkedin, Mail } from 'lucide-react'

const footerLinks = {
  platform: [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Sustainability', href: '/sustainability' },
    { name: 'Community', href: '/community' }
  ],
  venues: [
    { name: 'Add Your Venue', href: '/add-venue' },
    { name: 'Coworking Spaces', href: '/coworking' },
    { name: 'Cafes', href: '/cafes' },
    { name: 'Accommodations', href: '/accommodations' }
  ],
  resources: [
    { name: 'Blog', href: '/blog' },
    { name: 'Guides', href: '/guides' },
    { name: 'API Documentation', href: '/api' },
    { name: 'Help Center', href: '/help' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Contact', href: '/contact' }
  ]
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@sustainablenomads.com', label: 'Email' }
]

export function Footer() {
  return (
    <footer className="bg-neo-text-primary text-white border-t-4 border-neo-border">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Signup */}
        <NeoCard variant="flat" className="mb-16 bg-neo-primary border-white">
          <div className="p-8 text-center">
            <h3 className="heading-md mb-4 text-white">Stay Updated on Sustainable Travel</h3>
            <p className="body-lg mb-6 text-blue-100 max-w-2xl mx-auto">
              Get weekly updates on new sustainable venues, eco-travel tips, and nomad community highlights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <NeoInput 
                placeholder="Enter your email" 
                className="flex-1 bg-white text-neo-text-primary"
              />
              <NeoButton variant="secondary" size="md">
                Subscribe
              </NeoButton>
            </div>
          </div>
        </NeoCard>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-neo-secondary rounded-full flex items-center justify-center">
                <Leaf size={20} className="text-neo-text-primary" />
              </div>
              <span className="heading-sm text-white">SustainableNomads</span>
            </div>
            <p className="body-md text-gray-300 mb-6">
              Connecting conscious travelers with sustainable venues worldwide
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-neo-secondary hover:text-neo-text-primary transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <Icon size={18} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="heading-sm text-white mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="body-md text-gray-300 hover:text-neo-secondary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="heading-sm text-white mb-4">Venues</h4>
            <ul className="space-y-2">
              {footerLinks.venues.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="body-md text-gray-300 hover:text-neo-secondary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="heading-sm text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="body-md text-gray-300 hover:text-neo-secondary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="heading-sm text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="body-md text-gray-300 hover:text-neo-secondary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="body-sm text-gray-400 mb-4 md:mb-0">
            © 2024 SustainableNomads. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <span className="body-sm text-gray-400">Made with</span>
            <Leaf size={16} className="text-neo-success" />
            <span className="body-sm text-gray-400">for the planet</span>
          </div>
        </div>
      </div>
    </footer>
  )
}