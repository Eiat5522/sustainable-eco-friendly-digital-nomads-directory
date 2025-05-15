import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OptimizedImage } from './OptimizedImage'

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

  return (
    <div className={`relative min-h-[80vh] w-full ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <OptimizedImage
          image={backgroundImage}
          alt="Hero background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-3xl text-xl text-gray-300"
          >
            {subtitle}
          </motion.p>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSearch}
            className="relative mx-auto mt-8 max-w-2xl"
          >
            <div
              className={`relative transition-all duration-300 ${
                isFocused ? 'scale-105 transform' : ''
              }`}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full bg-white/10 px-6 py-4 text-white backdrop-blur-md transition-all placeholder:text-gray-300 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-green-500 p-3 text-white transition-all hover:bg-green-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </div>

            {/* Search suggestions - only show when focused and has query */}
            <AnimatePresence>
              {isFocused && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-x-0 top-full mt-2 rounded-2xl bg-white/10 p-4 backdrop-blur-md"
                >
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('Eco-friendly cafes')
                        if (onSearch) onSearch('Eco-friendly cafes')
                      }}
                      className="text-left text-gray-300 transition-colors hover:text-white"
                    >
                      🌱 Eco-friendly cafes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('Sustainable coworking')
                        if (onSearch) onSearch('Sustainable coworking')
                      }}
                      className="text-left text-gray-300 transition-colors hover:text-white"
                    >
                      💻 Sustainable coworking spaces
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('Green accommodations')
                        if (onSearch) onSearch('Green accommodations')
                      }}
                      className="text-left text-gray-300 transition-colors hover:text-white"
                    >
                      🏡 Green accommodations
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Feature Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mt-8 flex flex-wrap justify-center gap-2"
          >
            {['Solar Powered', 'Zero Waste', 'Organic', 'Local Community'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
