// Quick test to check Sanity connection
import { client } from '@/lib/sanity/client';

export default async function TestSanityPage() {
  try {
    const cities = await client.fetch('*[_type == "city"][0...3]');
    const listings = await client.fetch('*[_type == "listing"][0...3]');
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Sanity Connection Test</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Cities ({cities?.length || 0} found):</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(cities, null, 2)}
          </pre>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Listings ({listings?.length || 0} found):</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(listings, null, 2)}
          </pre>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Sanity Connection Failed</h1>
        <div className="bg-red-100 p-4 rounded">
          <pre className="text-red-800">{error.toString()}</pre>
        </div>
      </div>
    );
  }
}