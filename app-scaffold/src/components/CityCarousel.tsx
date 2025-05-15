import { useState, useRef, useEffect } from 'react'
import { OptimizedImage, generateImageSizes } from './OptimizedImage'
import { motion, AnimatePresence } from 'framer-motion'

interface City {
  _id: string
  name: string
  image: any // Sanity image reference
  slug: string
  listingCount: number
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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Navigation Buttons */}
      <button
        onClick={(e) => {
          e.preventDefault()
          previousSlide()
        }}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white hover:shadow-xl"
        aria-label="Previous city"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.preventDefault()
          nextSlide()
        }}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white hover:shadow-xl"
        aria-label="Next city"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Carousel Content */}
      <div
        ref={containerRef}
        className="relative h-[60vh] w-full touch-pan-y"
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, { offset, velocity }) => {
              setIsDragging(false)
              if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500) {
                if (offset.x > 0) {
                  previousSlide()
                } else {
                  nextSlide()
                }
              }
            }}
          >
            <div className="relative h-full w-full">
              <OptimizedImage
                image={cities[currentIndex].image}
                alt={cities[currentIndex].name}
                fill
                sizes={imageSizes}
                priority={currentIndex === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <h2 className="text-4xl font-bold text-white">{cities[currentIndex].name}</h2>
                <p className="mt-2 text-lg text-white/90">
                  {cities[currentIndex].listingCount} eco-friendly locations
                </p>
                <button
                  onClick={() => {
                    if (!isDragging && onCitySelect) {
                      onCitySelect(cities[currentIndex].slug)
                    }
                  }}
                  className="mt-4 rounded-lg bg-green-500 px-6 py-2 text-white transition-colors hover:bg-green-600"
                >
                  Explore {cities[currentIndex].name}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 transform gap-2">
        {cities.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
