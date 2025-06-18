import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-12">
          {/* CTA Content Side */}
          <div className="w-full">
            <div className="max-w-lg mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-white">
                Join Our Global Community of Sustainable Digital Nomads
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Connect with like-minded individuals, discover eco-friendly destinations, and contribute to a more sustainable future while working from anywhere.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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
