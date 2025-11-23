const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-05-16',
  useCdn: false,
});

async function debugCityAndImages() {
  try {

    // Test multiple city field possibilities
    const listings = await client.fetch(`
      *[_type == "listing" && moderation.featured == true][0...3] {
        _id,
        name,
        "cityRef": city,
        "cityTitle": city->title,
        "cityName": city->name,
        "citySlug": city->slug,
        primaryImage,
        "primaryImageUrl": primaryImage.asset->url,
        "primaryImageExists": defined(primaryImage.asset),
        "galleryCount": count(galleryImages),
        "moderation": moderation
      }
    `);
    listings.forEach((_listing, _index) => {
    });
    const cities = await client.fetch(`
      *[_type == "city"][0...5] {
        _id,
        title,
        name,
        "slug": slug.current
      }
    `);

    cities.forEach((_city, _index) => {
    });
    const referencedCities = await client.fetch(`
      *[_type == "listing" && defined(city) && moderation.featured == true] {
        "listingName": name,
        "cityRefId": city._ref,
        "cityExists": defined(*[_type == "city" && _id == ^.city._ref][0])
      }
    `);

    referencedCities.forEach((_ref, _index) => {
    });
  } catch (_error) {
  }
}

debugCityAndImages();
