import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Listing Not Found</h1>
      <p className="text-lg mb-6">Sorry, we couldn&apos;t find this listing.</p>
      <Link
        href="/listings"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
      >
        Browse Listings
      </Link>
      <Link
        href="/"
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Go Home
      </Link>
    </div>
  );
}
