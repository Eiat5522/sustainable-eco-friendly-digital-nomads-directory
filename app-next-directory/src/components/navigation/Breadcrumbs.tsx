'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbSegment {
  name: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  className?: string;
  includeSchema?: boolean;
}

export function Breadcrumbs({
  segments,
  className = '',
  includeSchema = true
}: BreadcrumbsProps) {
  // Generate JSON-LD schema
  const generateSchema = () => {
    const itemListElements = segments.map((segment, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@id': segment.href || window.location.href,
        'name': segment.name
      }
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': itemListElements
    };
  };

  return (
    <>
      {includeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSchema()) }}
        />
      )}

      <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
        <ol className="flex items-center space-x-2">
          {segments.map((segment, index) => (
            <li key={segment.name} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mx-2" />
              )}

              {segment.href ? (
                <Link
                  href={segment.href}
                  className={`text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 ${
                    index === segments.length - 1 ? 'font-medium' : ''
                  }`}
                >
                  {segment.name}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {segment.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
