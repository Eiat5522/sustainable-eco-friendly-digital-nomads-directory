import Link from 'next/link';

interface RelatedListingsProps {
  listings: any[];
  currentId?: string;
  title?: string;
}

export function RelatedListings({ listings, currentId, title = 'Related Listings' }: RelatedListingsProps) {
  // Exclude the current listing if currentId is provided
  const related = currentId
    ? listings.filter((l) => l.id !== currentId).slice(0, 4)
    : listings.slice(0, 4);

  if (!related.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((listing) => (
          <li key={listing.id} className="p-4 bg-stone-50 dark:bg-slate-800 rounded shadow">            <Link href={`/listings/${listing.slug || listing.id}`} className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
              {listing.name}
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-300">{listing.description_short}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
