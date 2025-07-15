import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Carbon awareness API integration
import { getCarbonIntensity } from '@/lib/carbon-awareness';

interface EcoConsciousHeroProps {}

const EcoConsciousHero: React.FC<EcoConsciousHeroProps> = () => {
  const [carbonIntensity, setCarbonIntensity] = useState<number | null>(null);
  const [optimizedLoading, setOptimizedLoading] = useState<boolean>(true);
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Canvas for adaptive background
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch carbon intensity data for user's location
  useEffect(() => {
    async function fetchCarbonData() {
      try {
        const intensity = await getCarbonIntensity();
        setCarbonIntensity(intensity);

        // Adjust visual complexity based on carbon intensity
        setOptimizedLoading(intensity > 300); // Reduce visual load when carbon intensity is high
      } catch (error) {
        console.error('Failed to get carbon intensity data', error);
        setOptimizedLoading(false);
      }
    }

    fetchCarbonData();
  }, []);

  // Create ambient background animation
  useEffect(() => {
    if (!canvasRef.current || !inView) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Create eco-friendly, low-power animation
    // Adjust complexity based on carbon intensity and device performance
    const complexity = optimizedLoading ? 10 : 30;

    // Animation frame variables
    let animationFrameId: number;
    const particles: Array<{x: number, y: number, size: number, speed: number, color: string}> = [];

    // Create particles
    for (let i = 0; i < complexity; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 0.5 + 0.1,
        color: theme === 'dark' ?
          `rgba(100, 255, 180, ${Math.random() * 0.4 + 0.1})` :
          `rgba(0, 128, 85, ${Math.random() * 0.3 + 0.05})`
      });
    }

    // Animation loop with performance optimization
    let lastTime = 0;
    const minFrameTime = optimizedLoading ? 50 : 16; // Less frequent updates when optimized

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;

      // Only render if enough time has passed (reduces power usage)
      if (deltaTime > minFrameTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          // Slow vertical movement
          particle.y += particle.speed;

          // Reset position when out of bounds
          if (particle.y > canvas.height) {
            particle.y = 0;
            particle.x = Math.random() * canvas.width;
          }
        });

        lastTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, [inView, optimizedLoading, theme]);

  // Personalized greeting based on time and user data
  const greeting = () => {
    const hour = new Date().getHours();
    const userName = session?.user?.name?.split(' ')[0] || '';

    if (hour < 12) return `Good morning${userName ? `, ${userName}` : ''}`;
    if (hour < 18) return `Good afternoon${userName ? `, ${userName}` : ''}`;
    return `Good evening${userName ? `, ${userName}` : ''}`;
  };

  return (
    <div ref={ref} className="relative w-full overflow-hidden">
      {/* Ambient background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="relative z-10 container mx-auto px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Personalized greeting with adaptive color */}
          {session?.user && (
            <p className="text-lg text-green-600 dark:text-green-400 mb-3 font-medium">
              {greeting()}
            </p>
          )}

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            <span className="block">Discover Sustainable Living</span>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-block text-green-600 dark:text-green-400"
            >
              for Digital Nomads
            </motion.span>
          </h1>

          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            Join our community of eco-conscious remote workers finding harmony between work,
            travel, and environmental responsibility.
          </p>

          {/* Adaptive CTA based on user state */}
          <div className="flex flex-wrap gap-4 mb-16">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 dark:bg-green-500
                dark:hover:bg-green-600 text-white rounded-full font-medium
                shadow-lg hover:shadow-xl transition-all"
            >
              {session ? 'Explore Destinations' : 'Join Now'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-100
                dark:hover:bg-gray-700 text-green-600 dark:text-green-400
                rounded-full font-medium border border-green-200 dark:border-gray-700
                shadow-lg hover:shadow-xl transition-all"
            >
              Learn More
            </motion.button>
          </div>

          {/* Environmental impact indicator */}
          {carbonIntensity !== null && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm
              bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Using eco-friendly rendering
              <span className="tooltip ml-1 cursor-help" title="This page adapts its visual complexity based on your region's current carbon intensity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EcoConsciousHero;
