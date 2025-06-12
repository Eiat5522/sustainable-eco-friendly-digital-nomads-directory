const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-05-16',
  useCdn: false,
});

async function testFeaturedListings() {
  try {
    console.log('Testing featured listings data...\n');

    const listings = await client.fetch(`*[_type == "listing" && moderation.featured == true][0...5]{
      _id,
      name,
      "slug": slug.current,
      category,
      "city": city->name,
      "primaryImageUrl": primaryImage.asset->url,
      "primaryImage": primaryImage.asset->{"url": url, "alt": alt, "metadata": metadata},
      moderation
    }`);

    console.log(`Found ${listings.length} featured listings:`);
    listings.forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.name}`);
      console.log(`   Slug: ${listing.slug || 'MISSING SLUG'}`);
      console.log(`   Category: ${listing.category}`);
      console.log(`   City: ${listing.city || 'MISSING CITY'}`);
      console.log(`   Image URL: ${listing.primaryImageUrl ? 'Present' : 'MISSING'}`);
      console.log(`   Featured: ${listing.moderation?.featured}`);
    });

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

testFeaturedListings();
