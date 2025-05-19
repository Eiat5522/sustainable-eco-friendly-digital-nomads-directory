import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import { getClient } from '@/lib/sanity.utils';

interface CityPageProps {
  params: {
    slug: string;
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const preview = draftMode().isEnabled;
  const client = getClient(preview);

  const city = await client.fetch(
    `*[_type == "city" && slug.current == $slug][0]{
      _id,
      name,
      description,
      "image": main_image_url,
      "gallery": gallery_image_urls,
      "slug": slug.current,
      "listings": *[_type == "listing" && references(^._id)]{
        _id,
        name,
        description_short,
        category,
        "image": primary_image_url,
        eco_focus_tags,
        digital_nomad_features,
        "slug": slug.current
      }
    }`,
    { slug: params.slug }
  );

  if (!city) {
    notFound();
  }

  return (
    <>
      {preview && <PreviewBanner />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="relative aspect-[21/9] rounded-xl overflow-hidden mb-8">
            {city.image ? (
              <img
                src={city.image}
                alt={city.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center">
                {city.name}
              </h1>
            </div>
          </div>
          {city.description && (
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-600 text-center">
                {city.description}
              </p>
            </div>
          )}
        </section>

        {/* Listings Grid */}
        {city.listings?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Sustainable Spaces in {city.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {city.listings.map((listing: any) => (
                <div
                  key={listing._id}
                  className="bg-white shadow-sm rounded-lg overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    {listing.image ? (
                      <img
                        src={listing.image}
                        alt={listing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {listing.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{listing.description_short}</p>
                    {listing.eco_focus_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {listing.eco_focus_tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
