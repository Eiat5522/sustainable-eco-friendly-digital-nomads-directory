import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';

const HeroSection: React.FC = () => {
  const router = useRouter();
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrollPosition = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrollPosition * 0.4}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
      transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }
    }
  };

  return (
    <section className="relative h-[90vh] min-h-[700px] overflow-hidden">
      {/* Background image with parallax effect */}
      <div className="absolute inset-0 z-0">
        <div ref={parallaxRef} className="absolute inset-0 h-[120%]">
          <Image
            src="/images/hero/hero_main.png"
            alt="Eco-friendly digital nomad workspace"
            fill
            priority
            sizes="100vw"
            className="object-cover"
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

          {/* Search form */}
          <motion.form
            onSubmit={handleSearch}
            className="mb-12 relative max-w-2xl"
            variants={itemVariants}
          >
            <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
              <div className="relative flex-grow mb-3 md:mb-0">
                <input
                  type="text"
                  placeholder="Search destinations, eco-lodges, or co-working spaces..."
                  className="w-full h-14 px-5 pr-12 rounded-lg text-lg bg-white/90 backdrop-blur-md border-0 focus:ring-2 focus:ring-green-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                className="h-14 px-8 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center justify-center transition-colors shadow-lg"
              >
                Explore
              </button>
            </div>

            <div className="flex mt-4 space-x-4 text-white/80">
              <span className="text-sm">Popular:</span>
              {['Bali', 'Lisbon', 'Chiang Mai', 'Mexico City'].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="text-sm hover:text-green-300 transition-colors"
                  onClick={() => {
                    setSearchQuery(term);
                    router.push(`/search?q=${encodeURIComponent(term)}`);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.form>

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  );
};

export default HeroSection;
