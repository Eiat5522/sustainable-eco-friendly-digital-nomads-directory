'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ContentAnalysis {
  thinContent: {
    listingId: string;
    listingName: string;
    wordCount: number;
    reason: string;
  }[];
  duplicateContent: {
    listing1Id: string;
    listing1Name: string;
    listing2Id: string;
    listing2Name: string;
    similarity: number;
  }[];
  missingMetadata: {
    listingId: string;
    listingName: string;
    missingFields: string[];
  }[];
}

interface AnalysisResponse {
  success: boolean;
  data: ContentAnalysis;
  message?: string; // Optional error message
  summary: {
    thinContentCount: number;
    duplicateContentCount: number;
    missingMetadataCount: number;
  };
}

export default function ContentAnalysisPage() {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const response = await fetch('/api/admin/analyze-content');
        if (!response.ok) {
          throw new Error('Failed to fetch content analysis');
        }
        const data: AnalysisResponse = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to analyze content');
        }
        setAnalysis(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg">
          <h2 className="text-red-700 dark:text-red-300 font-semibold mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Content Analysis</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Thin Content</h3>
          <p className="text-3xl text-red-600 dark:text-red-400">
            {analysis.thinContent.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Duplicate Content</h3>
          <p className="text-3xl text-amber-600 dark:text-amber-400">
            {analysis.duplicateContent.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Missing Metadata</h3>
          <p className="text-3xl text-blue-600 dark:text-blue-400">
            {analysis.missingMetadata.length}
          </p>
        </div>
      </div>

      {/* Thin Content Section */}
      {analysis.thinContent.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Thin Content Issues</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Word Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysis.thinContent.map((item) => (
                    <tr key={item.listingId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.listingName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.wordCount}
                      </td>
                      <td className="px-6 py-4">
                        {item.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/listings/${item.listingId}`}
                          className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Duplicate Content Section */}
      {analysis.duplicateContent.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Duplicate Content Issues</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Listing 1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Listing 2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Similarity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysis.duplicateContent.map((item) => (
                    <tr key={`${item.listing1Id}-${item.listing2Id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.listing1Name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.listing2Name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(item.similarity * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-4">
                          <Link
                            href={`/admin/listings/${item.listing1Id}`}
                            className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            Edit #1
                          </Link>
                          <Link
                            href={`/admin/listings/${item.listing2Id}`}
                            className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            Edit #2
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Missing Metadata Section */}
      {analysis.missingMetadata.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Missing Metadata</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Missing Fields
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysis.missingMetadata.map((item) => (
                    <tr key={item.listingId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.listingName}
                      </td>
                      <td className="px-6 py-4">
                        <ul className="list-disc list-inside">
                          {item.missingFields.map((field) => (
                            <li key={field} className="text-sm">
                              {field}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/listings/${item.listingId}`}
                          className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* No Issues Message */}
      {analysis.thinContent.length === 0 &&
       analysis.duplicateContent.length === 0 &&
       analysis.missingMetadata.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/50 p-6 rounded-lg">
          <h2 className="text-green-700 dark:text-green-300 font-semibold mb-2">
            All Clear!
          </h2>
          <p className="text-green-600 dark:text-green-400">
            No content issues were found. All listings meet our quality standards.
          </p>
        </div>
      )}
    </div>
  );
}
