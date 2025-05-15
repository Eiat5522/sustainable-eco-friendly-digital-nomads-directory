import { useState, useRef, useEffect } from 'react'
import { OptimizedImage, generateImageSizes } from './OptimizedImage'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

interface City {
  _id: string
  name: string
  image: any // Sanity image reference
  slug: string
  listingCount: number
  ecoScore?: number // Added eco score for sustainability rating
  sustainabilityFeatures?: string[] // Notable sustainability features
}

interface CityCarouselProps {
  cities: City[]
  onCitySelect?: (citySlug: string) => void
  className?: string
}

const imageSizes = generateImageSizes({
  320: 100,  // Full width on mobile
  768: 50,   // Half width on tablet
  1024: 33.3 // One third width on desktop
})

export function CityCarousel({ cities, onCitySelect, className = '' }: CityCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cities.length)
  }

  const previousSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cities.length) % cities.length)
  }

  const startAutoPlay = () => {
    timeoutRef.current = setInterval(nextSlide, 5000)
  }

  const stopAutoPlay = () => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current)
    }
  }

  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [])

  // Enhanced animations and interactions
  const controls = useAnimation()
  const [activeCity, setActiveCity] = useState<City | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (cities.length > 0 && !activeCity) {
      setActiveCity(cities[0])
    }
  }, [cities, activeCity])

  const selectCity = (city: City, index: number) => {
    setCurrentIndex(index)
    setActiveCity(city)
    if (onCitySelect) {
      onCitySelect(city.slug)
    }
  }

  // Generate eco badge based on score
  const getEcoBadge = (score?: number) => {
    if (!score) return null

    const badges = {
      high: { label: 'Eco Leader', color: 'bg-primary-500' },
      medium: { label: 'Eco Friendly', color: 'bg-primary-400' },
      low: { label: 'Eco Conscious', color: 'bg-primary-300' }
    }

    const badgeType = score > 80 ? 'high' : score > 50 ? 'medium' : 'low'
    return badges[badgeType]
  }

  return (
    <div className={`relative overflow-hidden py-12 ${className}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-300/20 via-primary-500/40 to-primary-300/20"></div>

      {/* Section title with eco design */}
      <div className="container mx-auto mb-8 text-center">
        <div className="inline-block relative">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Sustainable Cities
          </motion.h2>
          <motion.div
            className="absolute -bottom-2 left-0 h-1 bg-primary-500"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <motion.div
            className="absolute -right-6 -top-6"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.7, duration: 0.5, type: 'spring' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary-400">
              <path fill="currentColor" d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </motion.div>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore eco-friendly destinations perfect for digital nomads
        </p>
      </div>

      {/* Main carousel */}
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Navigation arrows with eco-friendly styling */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={previousSlide}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-3 shadow-lg border border-primary-200 text-primary-700"
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-3 shadow-lg border border-primary-200 text-primary-700"
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>

          {/* Carousel track */}
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-all"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {cities.map((city, index) => {
                const isActive = currentIndex === index
                const ecoBadge = getEcoBadge(city.ecoScore)

                return (
                  <motion.div
                    key={city._id}
                    className="w-full flex-shrink-0 px-2 md:px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div
                      className="relative overflow-hidden rounded-2xl aspect-[16/9] group cursor-pointer"
                      onClick={() => selectCity(city, index)}
                      onHoverStart={() => setHoveredIndex(index)}
                      onHoverEnd={() => setHoveredIndex(null)}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {/* Gradient overlay simulating 3D lighting effect */}
                      <div className="absolute inset-0 z-10 opacity-60 bg-gradient-to-t from-black via-transparent to-transparent" />

                      {hoveredIndex === index && (
                        <motion.div
                          className="absolute inset-0 z-10 bg-gradient-to-br from-primary-500/20 to-transparent"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}

                      {/* City image */}
                      <div className="absolute inset-0 w-full h-full">
                        <OptimizedImage
                          image={city.image}
                          alt={city.name}
                          fill
                          className={`object-cover transition-transform duration-700 ${hoveredIndex === index ? 'scale-110' : ''}`}
                          sizes={imageSizes}
                        />
                      </div>

                      {/* Content overlay */}
                      <div className="absolute inset-x-0 bottom-0 z-20 p-6 text-white">
                        <h3 className="text-xl md:text-2xl font-bold">{city.name}</h3>

                        <div className="flex items-center mt-2">
                          <span className="text-sm opacity-90">{city.listingCount} sustainable listings</span>

                          {ecoBadge && (
                            <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ecoBadge.color} text-white`}>
                              {ecoBadge.label}
                            </span>
                          )}
                        </div>

                        {/* Sustainability features */}
                        {isActive && city.sustainabilityFeatures && city.sustainabilityFeatures.length > 0 && (
                          <motion.div
                            className="mt-2 flex flex-wrap gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            {city.sustainabilityFeatures.slice(0, 3).map((feature, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {cities.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  currentIndex === index ? 'bg-primary-600 w-6' : 'bg-gray-300 dark:bg-gray-600'
                } transition-all duration-300`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Nature-inspired decoration */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-300/20 via-primary-500/40 to-primary-300/20"></div>
      <div className="absolute -bottom-6 right-10 text-primary-200/30">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>
      </div>
    </div>
  )
}
