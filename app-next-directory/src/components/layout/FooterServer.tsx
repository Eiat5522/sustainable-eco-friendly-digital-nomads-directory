/**
 * Footer Server Component
 *
 * Server component version of the footer.
 * Static content renders immediately, newsletter form
 * is isolated as a client component for interactivity.
 *
 * Key features:
 * - Static links and content render on the server
 * - Newsletter form is a separate client island
 * - Optimized for partial prerendering
 */

import { Instagram, Leaf, Linkedin, Mail, MapPin, MessageSquare, Twitter } from 'lucide-react';
import Link from 'next/link';
import { NewsletterForm } from '@/components/layout/NewsletterForm';

const footerLinks = {
  quickLinks: [
    { name: 'Home', href: '/' },
    { name: 'Find Listings', href: '/search' },
    { name: 'Blog', href: '/blog' },
    { name: 'Submit Your Business', href: '/contact-us' },
    { name: 'Login / Register', href: '/auth/login' },
  ],
  categories: [
    { name: 'Co-working Spaces', href: '/search/results?category=coworking' },
    { name: 'Cafes', href: '/search/results?category=cafe' },
    { name: 'Restaurants', href: '/search/results?category=restaurant' },
    { name: 'Accommodation', href: '/search/results?category=accommodation' },
    { name: 'Activities', href: '/search/results?category=activities' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/sustainablenomads', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/sustainablenomads', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/sustainablenomads', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@sustainablenomads.com', label: 'Email' },
];

interface FooterServerProps {
  showNewsletter?: boolean;
}

export function FooterServer({ showNewsletter = true }: FooterServerProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer-content"
      className="bg-neo-text-primary text-white border-t-4 border-neo-border"
    >
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Section - Client Island */}
        {showNewsletter && <NewsletterForm />}

        {/* Main Footer Content - Static Server Rendered */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
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
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-neo-secondary hover:text-neo-text-primary transition-colors duration-200"
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <Icon size={18} aria-hidden="true" focusable="false" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="heading-sm text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="body-md text-gray-300 hover:text-neo-secondary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="heading-sm text-white mb-4">Categories</h4>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="body-md text-gray-300 hover:text-neo-secondary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="heading-sm text-white mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 shrink-0 text-neo-secondary" aria-hidden="true" />
                <span className="body-md text-gray-300">
                  123 Green Street, Watthana, Bangkok 10110, Thailand
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-1 shrink-0 text-neo-secondary" aria-hidden="true" />
                <a
                  href="mailto:hello@sustainablenomads.com"
                  className="body-md text-gray-300 hover:text-neo-secondary transition-colors"
                >
                  hello@sustainablenomads.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare
                  size={18}
                  className="mt-1 shrink-0 text-neo-secondary"
                  aria-hidden="true"
                />
                <Link
                  href="/contact-us"
                  className="body-md text-gray-300 hover:text-neo-secondary transition-colors"
                >
                  Send us a message
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="body-sm text-gray-400 mb-4 md:mb-0">
            © {year} SustainableNomads. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <span className="body-sm text-gray-400">Made with</span>
            <Leaf size={16} className="text-neo-success" />
            <span className="body-sm text-gray-400">for the planet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
