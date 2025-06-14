'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/sanity/client';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Log environment variables
        console.log('Environment variables:', {
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        });

        // Test Sanity connection
        const result = await client.fetch(`*[_type == "listing"][0...1] {
          _id,
          title
        }`);

        console.log('Sanity test query result:', result);
        setData(result);
        setStatus('success');
      } catch (err) {
        console.error('Error testing Sanity connection:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sanity Connection Test</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Environment Variables:</h2>
        <pre className="bg-gray-100 p-4 rounded mb-6">
          {JSON.stringify({
            NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
          }, null, 2)}
        </pre>

        <h2 className="text-lg font-semibold mb-4">Connection Status:</h2>
        <div className="mb-6">
          {status === 'loading' && (
            <p className="text-blue-600">Testing connection...</p>
          )}
          {status === 'success' && (
            <p className="text-green-600">Connection successful!</p>
          )}
          {status === 'error' && (
            <p className="text-red-600">Connection failed: {error}</p>
          )}
        </div>

        {data && (
          <>
            <h2 className="text-lg font-semibold mb-4">Test Query Result:</h2>
            <pre className="bg-gray-100 p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
