'use client';

import type { ContentGuidelines } from '@/types/moderation';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

interface GuidelinesProps {
  guidelines: ContentGuidelines[];
}

export function Guidelines({ guidelines }: GuidelinesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Content Guidelines
      </h2>

      <div className="space-y-4">
        {guidelines.map((category) => (
          <motion.div
            key={category.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {category.category}
              </h3>
              {expandedCategory === category.id ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Category Content */}
            {expandedCategory === category.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-4"
              >
                <div className="prose dark:prose-invert max-w-none">
                  {category.rules.map((rule, index) => (
                    <div key={index} className="mb-6">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                        {rule.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {rule.description}
                      </p>

                      {/* Examples */}
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        {/* Good Examples */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <h5 className="flex items-center text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                            <Check className="h-4 w-4 mr-2" />
                            Good Examples
                          </h5>
                          <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-300 space-y-1">
                            {rule.examples.good.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Bad Examples */}
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <h5 className="flex items-center text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            <X className="h-4 w-4 mr-2" />
                            Examples to Avoid
                          </h5>
                          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                            {rule.examples.bad.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
