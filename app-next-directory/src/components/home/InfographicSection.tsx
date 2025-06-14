import { motion } from 'framer-motion';
import Image from 'next/image'; // Assuming you might have a preview image
import Link from 'next/link';
import React from 'react';
import { useInView } from 'react-intersection-observer';

const InfographicSection: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section ref={ref} className="py-20 bg-green-50 dark:bg-green-900/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            The <span className="text-green-600 dark:text-green-400">Sustainable Nomad</span> Blueprint
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-8">
            Discover how to live, work, and explore the world responsibly. Our blueprint guides you through the essentials of eco-conscious digital nomadism.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 md:p-12 my-12 max-w-5xl mx-auto"
        >
          {/* Placeholder for Infographic Visual */}
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Infographic Coming Soon!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We're working on a beautiful visual guide for the Sustainable Nomad Blueprint.
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              In the meantime, you can click below to learn more about the concepts.
            </p>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/docs/infographics/sustainable-nomad-blueprint" // Link to where the full infographic might be viewed or downloaded
              className="inline-block px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              View Full Blueprint
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Want to dive deeper? Explore our <Link href="/blog" className="text-green-600 dark:text-green-400 hover:underline">blog</Link> for more tips and stories.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InfographicSection;
