import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { OptimizedImage } from './OptimizedImage'
import Image from 'next/image'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  backgroundImage?: any // Sanity image reference
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export function HeroSection({
  title = 'Discover Eco-Friendly Spaces',
  subtitle = 'Find sustainable locations for digital nomads across Thailand',
  backgroundImage,
  searchPlaceholder = 'Search for eco-friendly spaces...',
  onSearch,
  className = '',
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  // Add parallax scroll effect
  const { scrollY } = useScroll()
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150])
  const opacityTransform = useTransform(scrollY, [0, 300], [1, 0.3])

  // Particle animation for eco elements
  const [ecoParticles, setEcoParticles] = useState<Array<{id: number, x: number, y: number, size: number, rotation: number}>>([])
  
  useEffect(() => {
    // Create floating eco elements (leaves, recycling symbols)
    const particles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 20,
      rotation: Math.random() * 360
    }))
    setEcoParticles(particles)
  }, [])

  return (
    <div className={`relative min-h-[90vh] w-full overflow-hidden ${className}`}>
      {/* Background with parallax effect */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{ y: backgroundY }}
      >
        {backgroundImage ? (
          <OptimizedImage
            image={backgroundImage}
            alt="Hero background"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-400 to-category-cafe" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
      </motion.div>

      {/* Eco-friendly floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatePresence>
          {ecoParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute text-primary-300 opacity-50"
              initial={{ 
                x: `${particle.x}%`, 
                y: `${particle.y}%`, 
                rotate: particle.rotation,
                scale: 0
              }}
              animate={{ 
                x: [`${particle.x}%`, `${particle.x + (Math.random() * 10) - 5}%`],
                y: [`${particle.y}%`, `${particle.y - 10}%`],
                rotate: particle.rotation + 360,
                scale: [0, 1, 0.8],
                opacity: [0, 0.7, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 15 + Math.random() * 20,
                ease: "easeInOut"
              }}
              style={{
                width: particle.size,
                height: particle.size
              }}
            >
              {particle.id % 3 === 0 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.82,15.42L19.32,19.75C18.83,20.61 17.92,21.06 17,21H15V23L12.5,18.5L15,14V16H17.82L15.6,12.15L19.93,9.65L21.73,12.77C22.25,13.54 22.32,14.57 21.82,15.42M9.21,3.06H14.21C15.19,3.06 16.04,3.63 16.45,4.45L17.45,6.19L19.18,5.19L16.54,9.6L11.39,9.69L13.12,8.69L11.71,6.24L9.5,10.09L5.16,7.59L6.96,4.47C7.37,3.64 8.22,3.06 9.21,3.06M5.05,19.76L2.55,15.43C2.06,14.58 2.13,13.56 2.64,12.79L3.64,11.06L1.91,10.06L7.05,10.14L9.7,14.56L7.97,13.56L6.56,16H11V21H7.4C6.47,21.07 5.55,20.61 5.05,19.76Z" />
                </svg>
              ) : particle.id % 3 === 1 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.5,6.9L13.42,8H10.5L10.35,8.34L12.06,10.55L12.5,6.9M15.09,21.12L11.5,18V21H9.5V10.9L8.89,10.24L7,13L3.46,11L5.64,8.27C5.87,7.97 6.21,7.76 6.59,7.68L8.5,7.29L9.69,4.97L13.32,6.94L12.89,7.9L14.5,9.1V10.89L18.97,16.62L15.09,21.12M17.76,10.56L20.53,12.32L21.3,11.32L18.54,9.56L17.76,10.56Z" />
                </svg>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Logo overlay */}
      <div className="absolute top-4 left-4 w-40 h-40">
        <Image
          src="/images/sustainable_nomads.png"
          alt="Sustainable Nomads Logo"
          width={160}
          height={160}
          className="object-contain"
        />
      </div>

      {/* Content */}
      <div className="relative flex min-h-[90vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center"
          style={{ opacity: opacityTransform }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-3 text-base text-gray-200 sm:text-lg md:text-xl max-w-3xl mx-auto"
          >
            {subtitle}
          </motion.p>
          
          {/* Glassmorphism search box */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onSubmit={handleSearch}
            className="mt-8 sm:mx-auto sm:max-w-lg"
          >
            <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-full p-1.5 flex items-center shadow-lg transition-all hover:bg-white/30">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={searchPlaceholder}
                className="block w-full rounded-full text-slate-900 placeholder-gray-500 bg-white/70 py-3 px-5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="ml-3 inline-flex items-center justify-center rounded-full border border-transparent bg-primary-500 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Search
              </motion.button>
            </div>
          </motion.form>

          {/* Eco badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {['Carbon Neutral', 'Zero Waste', 'Sustainable', 'Eco-Friendly', 'Ethical'].map((badge) => (
              <div 
                key={badge}
                className="rounded-full px-4 py-1.5 text-sm bg-white/10 backdrop-blur-md text-white border border-white/20"
              >
                {badge}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          <span className="text-white text-sm mb-2">Explore</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M12 5L12 19M12 19L18 13M12 19L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
