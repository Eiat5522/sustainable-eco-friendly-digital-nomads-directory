import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Image/Visual Side */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {/* Placeholder SVG or Text */}
              <div className="text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Illustrative image of a digital nomad in an eco-friendly setting. Image coming soon.</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-green-800/30 to-transparent"></div>

              {/* Testimonial overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-lg font-bold">J</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-200 text-sm italic mb-1">
                      "Finding sustainable accommodations was a game-changer for my nomadic lifestyle. I can now work remotely while minimizing my environmental impact."
                    </p>
                    <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                      Jamie Chen, Digital Nomad
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats badges */}
            <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg hidden md:block">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Carbon Footprint</p>
              <p className="text-lg font-bold text-green-600">-32% 🌱</p>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg hidden md:block">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Community Rating</p>
              <p className="text-lg font-bold text-amber-500">4.9/5 ⭐</p>
            </div>
          </div>

          {/* CTA Content Side */}
          <div className="w-full lg:w-1/2">
            <div className="max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-white">
                Join Our Global Community of Sustainable Digital Nomads
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Connect with like-minded individuals, discover eco-friendly destinations, and contribute to a more sustainable future while working from anywhere.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  'Access to exclusive eco-friendly listings',
                  'Connect with sustainable communities',
                  'Verified carbon-neutral workspaces',
                  'Monthly virtual sustainability workshops'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-gray-700 dark:text-gray-200">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/join"
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition shadow-lg hover:shadow-xl"
                >
                  Join Now - Free
                </Link>
                <Link
                  href="/explore"
                  className="px-8 py-3 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg font-medium text-center transition"
                >
                  Explore Destinations
                </Link>
              </div>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Already a member? <Link href="/login" className="text-green-600 hover:underline">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
