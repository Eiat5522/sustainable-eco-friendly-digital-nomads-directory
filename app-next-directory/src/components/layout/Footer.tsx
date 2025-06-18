'use client';

import Link from 'next/link';

const handleBrowseListingsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  // Scroll to top of page
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Focus on search box after scroll completes
  setTimeout(() => {
    const searchBox = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchBox) {
      searchBox.focus();
      searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 800);
};

export default function Footer() {
  return (
    <footer className="w-full text-white bg-[rgb(33,196,93)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Sustainable Nomads
              </h3>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Connecting eco-conscious consumers with sustainable businesses in Thailand. Our mission is to promote environmental responsibility and support the growth of eco-friendly enterprises.
            </p>
            {/* Social Media Icons */}
            <div className="flex space-x-4 mt-6">
              <Link href="#" className="text-white/80 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.337-1.307C3.595 14.135 3.8 11.436 3.8 11.436s-.195-2.698 1.312-4.234c.889-.817 2.04-1.307 3.337-1.307 1.297 0 2.448.49 3.337 1.307 1.507 1.536 1.312 4.234 1.312 4.234s.195 2.699-1.312 4.235c-.889.817-2.04 1.307-3.337 1.307z"/>
                </svg>
              </Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white/90 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>              <li>
                <a 
                  href="#" 
                  onClick={handleBrowseListingsClick}
                  className="text-white/90 hover:text-white transition-colors text-sm cursor-pointer"
                >
                  Browse Listings
                </a>
              </li>
              <li>
                <Link href="/blog" className="text-white/90 hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>              <li>
                <Link href="/auth/signin" className="text-white/90 hover:text-white transition-colors text-sm">
                  Submit Your Business
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="text-white/90 hover:text-white transition-colors text-sm">
                  Login / Register
                </Link>
              </li>
            </ul>
          </div>          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Categories
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/search?q=Coworking" className="text-white/90 hover:text-white transition-colors text-sm">
                  Co-working Spaces
                </Link>
              </li>
              <li>
                <Link href="/search?q=Accommodation" className="text-white/90 hover:text-white transition-colors text-sm">
                  Eco Accommodations
                </Link>
              </li>
              <li>
                <Link href="/search?q=Cafe" className="text-white/90 hover:text-white transition-colors text-sm">
                  Sustainable Cafes
                </Link>
              </li>
              <li>
                <Link href="/search?q=Community" className="text-white/90 hover:text-white transition-colors text-sm">
                  Nomad Communities
                </Link>
              </li>
              <li>
                <Link href="/search?q=Events" className="text-white/90 hover:text-white transition-colors text-sm">
                  Green Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Contact Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white/90 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p className="text-white/90 text-sm">
                  123 Green Street, Watthana,<br />
                  Bangkok 10110, Thailand
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <p className="text-white/90 text-sm">
                  info@sustainablenomads.com
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <p className="text-white/90 text-sm">
                  +66 2 234 5678
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <p className="text-white/90 text-sm">
                  Send us a message
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright and legal links */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-white/90 text-sm">
              © 2025 Sustainable Nomads Thailand. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-white/90 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-white/90 hover:text-white transition-colors text-sm">
                Terms of Service  
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}