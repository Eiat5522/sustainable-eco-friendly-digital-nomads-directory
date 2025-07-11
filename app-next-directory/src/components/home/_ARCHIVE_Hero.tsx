'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative bg-gray-800 text-white">
      {/* Background Image with Next.js Image component */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero_main.png"
          alt="Digital nomad workspace"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block">Sustainable Spaces for</span>
            <span className="block text-primary-400">Digital Nomads</span>
          </h1>

          <p className="text-lg md:text-xl mb-8 text-gray-200">
            Discover eco-friendly workspaces, accommodations, and cafes around the world.
            Join our community of environmentally conscious digital nomads.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition duration-150 ease-in-out"
            >
              Explore Spaces
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary-400 text-base font-medium rounded-md text-primary-200 bg-primary-900 bg-opacity-50 hover:bg-opacity-70 transition duration-150 ease-in-out"
            >
              Learn More
            </Link>
          </div>

          {/* Stats or Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: '500+', text: 'Eco-friendly Spaces' },
              { number: '50+', text: 'Cities Worldwide' },
              { number: '10k+', text: 'Digital Nomads' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-400">{stat.number}</div>
                <div className="text-gray-300">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 md:h-16 text-gray-50 fill-current"
          viewBox="0 0 1440 54"
          preserveAspectRatio="none"
        >
          <path d="M0 22L120 16.7C240 11 480 1.00001 720 0.700012C960 0.400012 1200 10 1320 15.3L1440 20V54H1320C1200 54 960 54 720 54C480 54 240 54 120 54H0V22Z"></path>
        </svg>
      </div>
    </div>
  );
}
