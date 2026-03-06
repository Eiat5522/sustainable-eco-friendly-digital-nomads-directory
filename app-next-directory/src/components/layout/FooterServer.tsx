import { Leaf, Mail, MapPin, MessageSquare, XIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { FooterYear } from '@/components/layout/FooterYear';
import { NewsletterForm } from '@/components/layout/NewsletterForm';

const footerLinks = {
  quickLinks: [
    { name: 'Home', href: '/' },
    { name: 'Find Listings', href: '/search' },
    { name: 'Categories', href: '/categories' },
    { name: 'Blog', href: '/blog' },
    { name: 'Submit Your Business', href: '/contact-us' },
    { name: 'Login / Register', href: '/auth/login' },
  ],
  categories: [
    { name: 'Co-working Spaces', href: '/categories/coworking' },
    { name: 'Cafes', href: '/categories/cafe' },
    { name: 'Restaurants', href: '/categories/restaurant' },
    { name: 'Accommodation', href: '/categories/accommodation' },
    { name: 'Activities', href: '/categories/activities' },
  ],
};

const socialLinks = [
  { icon: XIcon, href: 'https://twitter.com/sustainablenomads', label: 'X (formerly Twitter)' },
  { icon: Mail, href: 'mailto:hello@sustainablenomads.com', label: 'Email' },
];

interface FooterServerProps {
  showNewsletter?: boolean;
}

export function FooterServer({ showNewsletter = true }: FooterServerProps) {
  return (
    <footer
      id="footer-content"
      className="relative overflow-hidden border-t-4 border-neo-border bg-neo-border text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-surface) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute -right-8 top-8 h-28 w-28 rotate-12 border-4 border-neo-surface bg-neo-primary opacity-80" />
      <div className="pointer-events-none absolute left-8 bottom-8 h-20 w-20 rounded-full border-4 border-neo-surface bg-neo-success opacity-80" />

      <div className="container relative z-10 mx-auto px-4 py-16">
        {showNewsletter && <NewsletterForm />}

        <div className="mb-10 grid grid-cols-1 gap-8 border-4 border-neo-surface bg-white/5 p-6 md:grid-cols-2 lg:grid-cols-4 md:p-8">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-neo-surface bg-neo-secondary">
                <Leaf size={20} className="text-neo-border" />
              </div>
              <span className="text-lg font-black uppercase tracking-[0.06em]">
                SustainableNomads
              </span>
            </div>
            <p className="mb-6 text-sm font-medium text-white/85">
              Connecting conscious travelers with sustainable venues worldwide.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center border-2 border-neo-surface bg-white/10 transition-colors hover:bg-neo-secondary hover:text-neo-border"
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <Icon size={18} aria-hidden="true" focusable="false" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-neo-secondary">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-white/85 transition-colors hover:text-neo-secondary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-neo-secondary">
              Categories
            </h4>
            <ul className="space-y-2">
              {footerLinks.categories.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-white/85 transition-colors hover:text-neo-secondary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-neo-secondary">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-neo-secondary"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-white/85">
                  123 Green Street, Watthana, Bangkok 10110, Thailand
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-neo-secondary" aria-hidden="true" />
                <a
                  href="mailto:hello@sustainablenomads.com"
                  className="text-sm font-medium text-white/85 hover:text-neo-secondary"
                >
                  hello@sustainablenomads.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare
                  size={18}
                  className="mt-0.5 shrink-0 text-neo-secondary"
                  aria-hidden="true"
                />
                <Link
                  href="/contact-us"
                  className="text-sm font-medium text-white/85 hover:text-neo-secondary"
                >
                  Send us a message
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-white/30 pt-6 md:flex-row">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/75">
            Copyright{' '}
            <Suspense fallback={<span>...</span>}>
              <FooterYear />
            </Suspense>{' '}
            SustainableNomads.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/75">
            <span>Made for the planet</span>
            <Leaf size={14} className="text-neo-success" />
          </div>
        </div>
      </div>
    </footer>
  );
}
