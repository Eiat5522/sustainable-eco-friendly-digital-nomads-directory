"use client";

import { motion, easeInOut } from 'framer-motion';
import SanityImage from "@/components/SanityImage";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const SearchDialog = dynamic(() => import('../search/SearchDialog').then((mod) => mod.SearchDialog), {
  ssr: false,
  loading: () => null,
});

// Props for optional override of default title and subtitle
interface HeroSectionProps {
  title?: string;
  subtitle?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, subtitle }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Ensure component is mounted on client before hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      const parallaxElement = document.getElementById('parallax-bg');
      if (parallaxElement) {
        const scrollPosition = window.scrollY;
        parallaxElement.style.transform = `translateY(${scrollPosition * 0.4}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: easeInOut }
    }
  };

  return (
    <>
      <section className="relative h-[clamp(60svh, 80vh, 100svh)] overflow-hidden">
        {/* Background image with parallax effect */}
        <div className="absolute inset-0 z-0">
          {/* Ensure parent has position: relative and explicit height for Image fill */}
          <div 
            id="parallax-bg" 
            className="relative w-full h-full overflow-hidden"
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <SanityImage
              image={null}
              src="/images/hero/hero_main.png"
              alt="Eco-friendly digital nomad workspace"
              width={1920}
              height={1080}
              priority
              sizes="100vw"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              fallbackSrc="/images/hero/hero_main.png"
              fallbackAlt="Eco-friendly digital nomad workspace"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-800/40 backdrop-blur-[2px]" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.div
            className="max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              className="text-white text-5xl md:text-7xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              <span className="block">Find <span className="text-green-300">Eco-Friendly</span></span>
              <span className="block">Spaces for <span className="text-green-300">Digital Nomads</span></span>
            </motion.h1>

            <motion.p
              className="text-white/90 text-xl md:text-2xl mb-12 max-w-2xl"
              variants={itemVariants}
            >
              Discover sustainable accommodations, workspaces, and communities
              that align with your environmental values.
            </motion.p>

            {/* Search Trigger */}
            <motion.div
              className="mb-12 relative max-w-2xl"
              variants={itemVariants}
            >
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full h-14 px-5 pr-12 rounded-lg text-lg bg-white/90 backdrop-blur-md border-0 focus:ring-2 focus:ring-green-400 text-left text-gray-500 flex items-center"
              >
                <svg
                  className="icon h-5 w-5 mr-4 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search destinations, eco-lodges, or co-working spaces...
              </button>
              <div className="flex mt-4 space-x-4 text-white/80">
                <span className="text-sm font-medium">Popular:</span>
                {['Bali', 'Lisbon', 'Chiang Mai', 'Mexico City'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="text-sm hover:text-green-300 transition-colors"
                    onClick={() => {
                      router.push(`/listings?city=${encodeURIComponent(term)}`);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              className="flex flex-wrap gap-4"
              variants={itemVariants}
            >
              <Link
                href="/join"
                className="inline-block px-8 py-4 bg-white hover:bg-gray-100 text-green-800 font-semibold rounded-lg transition-all transform hover:-translate-y-1 hover:shadow-xl"
              >
                Join Community
              </Link>
              <Link
                href="/about"
                className="inline-block px-8 py-4 bg-transparent hover:bg-white/10 text-white border border-white/30 font-semibold rounded-lg transition-all transform hover:-translate-y-1 hover:shadow-xl"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{
            opacity: { delay: 1.5, duration: 1 },
            y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
        >
          <svg
            className="icon h-10 w-10 text-white"
            xmlns="http://www.w3.org/2000/svg"
            width={40}
            height={40}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
export default HeroSection;
