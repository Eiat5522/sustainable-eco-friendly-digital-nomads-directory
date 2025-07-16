"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./Button";
import { Card, CardContent } from "./card";
import { Separator } from "./separator";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Quote, Star, MapPin, Leaf, Wifi, Coffee } from 'lucide-react';
import { motion, useAnimation, useInView } from "framer-motion";

export interface CityTestimonial {
  id: number
  name: string
  role: string
  location: string
  content: string
  rating: number
  avatar: string
  city: string
  highlights: string[]
  sustainabilityScore: number
}

export interface SustainableNomadTestimonialsProps {
  title?: string
  subtitle?: string
  testimonials?: CityTestimonial[]
  autoRotateInterval?: number
  showSustainabilityScore?: boolean
  className?: string
}

export function SustainableNomadTestimonials({
  title = "Sustainable Digital Nomad Destinations",
  subtitle = "Discover eco-friendly cities in Thailand perfect for remote work and sustainable living",
  testimonials = [
    {
      id: 1,
      name: "Emma Rodriguez",
      role: "UX Designer & Sustainability Advocate",
      location: "Originally from Barcelona",
      content: "Chiang Mai has completely transformed my perspective on sustainable nomad living. The co-working spaces run on solar power, local markets offer zero-waste options, and the community of eco-conscious nomads is incredibly supportive. I've reduced my carbon footprint by 60% while maintaining peak productivity.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      city: "Chiang Mai",
      highlights: ["Solar-powered co-working", "Zero-waste markets", "60% carbon reduction"],
      sustainabilityScore: 95
    },
    {
      id: 2,
      name: "Marcus Chen",
      role: "Full Stack Developer",
      location: "Originally from Singapore",
      content: "Koh Phangan isn't just about beaches - it's a hub for sustainable tech innovation. The island runs on renewable energy, has excellent fiber internet, and the local community actively supports environmental initiatives. Perfect balance of work and eco-conscious living.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      city: "Koh Phangan",
      highlights: ["Renewable energy", "Fiber internet", "Tech innovation hub"],
      sustainabilityScore: 92
    },
    {
      id: 3,
      name: "Sarah Thompson",
      role: "Content Creator & Environmental Blogger",
      location: "Originally from Vancouver",
      content: "Pai offers the perfect escape for nomads seeking sustainability without sacrificing connectivity. The town's commitment to preserving nature while providing modern amenities is remarkable. I've never been more productive or environmentally conscious.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      city: "Pai",
      highlights: ["Nature preservation", "Modern amenities", "Eco-conscious community"],
      sustainabilityScore: 88
    },
    {
      id: 4,
      name: "David Kim",
      role: "Product Manager & Green Tech Enthusiast",
      location: "Originally from Seoul",
      content: "Krabi has emerged as a leader in sustainable tourism and remote work infrastructure. The combination of pristine nature, eco-friendly accommodations, and reliable internet makes it ideal for conscious nomads. The local sustainability initiatives are truly inspiring.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      city: "Krabi",
      highlights: ["Sustainable tourism", "Eco accommodations", "Pristine nature"],
      sustainabilityScore: 90
    }
  ],
  autoRotateInterval = 7000,
  showSustainabilityScore = true,
  className,
}: SustainableNomadTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const sectionRef = { current: null }
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const controls = useAnimation()

  useEffect(() => {
    if (autoRotateInterval <= 0 || testimonials.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((activeIndex + 1) % testimonials.length)
    }, autoRotateInterval)

    return () => clearInterval(interval)
  }, [testimonials.length, autoRotateInterval])

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  const handlePrev = () => {
    setActiveIndex((activeIndex - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setActiveIndex((activeIndex + 1) % testimonials.length)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (testimonials.length === 0) {
    return null
  }

  const currentTestimonial = testimonials[activeIndex]

  return (
    <section ref={sectionRef} id="sustainable-nomad-testimonials" className={cn("py-16 md:py-32 relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50", className)}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzNGQzOTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="text-center mb-12 space-y-4"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-4"
          >
            <Leaf className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Eco-Friendly Destinations</span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
            {title}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-gray-600 max-w-[700px] mx-auto md:text-xl/relaxed">
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="max-w-[1200px] mx-auto"
        >
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute -top-6 -left-6 z-10">
              <Quote className="h-12 w-12 text-green-500/30" strokeWidth={1} />
            </div>

            <div className="relative h-[450px] md:h-[400px]">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 border-green-200 bg-white/80 backdrop-blur-sm",
                    index === activeIndex
                      ? "opacity-100 translate-x-0 shadow-xl shadow-green-100/50"
                      : "opacity-0 translate-x-[100px] pointer-events-none",
                  )}
                >
                  <CardContent className="p-6 md:p-8 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-green-200">
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                          <p className="text-sm text-gray-600 font-medium">{testimonial.role}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {testimonial.location}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex mb-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                        {showSustainabilityScore && (
                          <div className="flex items-center gap-1 text-xs">
                            <Leaf className="h-3 w-3 text-green-600" />
                            <span className="font-semibold text-green-700">
                              {testimonial.sustainabilityScore}% Eco Score
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200">
                        <MapPin className="h-3 w-3 text-green-600" />
                        <span className="text-sm font-medium text-green-700">{testimonial.city}, Thailand</span>
                      </div>
                    </div>

                    <Separator className="my-4 bg-green-200" />

                    <p className="flex-1 text-gray-700 text-base/relaxed mb-6">
                      "{testimonial.content}"
                    </p>

                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        Key Sustainability Features
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {testimonial.highlights.map((highlight, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 border border-green-200 text-xs text-green-700"
                          >
                            {i === 0 && <Wifi className="h-3 w-3" />}
                            {i === 1 && <Coffee className="h-3 w-3" />}
                            {i === 2 && <Leaf className="h-3 w-3" />}
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center items-center gap-6 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full h-12 w-12 border-green-200 hover:bg-green-50 hover:border-green-300"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5 text-green-600" />
            </Button>

            <div className="flex gap-3 items-center justify-center">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    index === activeIndex 
                      ? "bg-green-500 scale-125" 
                      : "bg-green-200 hover:bg-green-300",
                  )}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full h-12 w-12 border-green-200 hover:bg-green-50 hover:border-green-300"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5 text-green-600" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default SustainableNomadTestimonials