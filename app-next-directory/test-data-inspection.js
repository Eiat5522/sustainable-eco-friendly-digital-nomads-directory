nst { createClient } = require('@sanity/client');

// Create client
const client = createClient({
  projectId: 'sc70w3cr',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03',
});

async function inspectData() {
  console.log('🔍 Inspecting Sanity Data...\n');

  try {
    // Check featured listings
    console.log('📋 FEATURED LISTINGS:');
    const featuredListings = await client.fetch(`
      *[_type == "listing" && moderation.featured == true] | order(moderation.featured_order asc, _createdAt desc) [0...4] {
        _id,
        name,
        slug,
        category,
        description_short,
        primaryImage {
          asset->{
            _id,
            url
          }
        },
        city->{
          title,
          slug
        }
      }
    `);

    featuredListings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.name}`);
      console.log(`   Slug: ${listing.slug?.current || 'NO SLUG'}`);
      console.log(`   Category: ${listing.category}`);
      console.log(`   City: ${listing.city?.title || 'NO CITY'}`);
      console.log(`   Image: ${listing.primaryImage?.asset?.url ? 'HAS IMAGE' : 'NO IMAGE'}`);
      if (listing.primaryImage?.asset?.url) {
        console.log(`   Image URL: ${listing.primaryImage.asset.url}`);
      }
      console.log('');
    });

    console.log('\n🏙️ CITIES WITH IMAGES:');
    const cities = await client.fetch(`
      *[_type == "city"] | order(_createdAt desc) [0...3] {
        _id,
        title,
        slug,
        mainImage {
          asset->{
            _id,
            url
          }
        }
      }
    `);

    cities.forEach((city, index) => {
      console.log(`${index + 1}. ${city.title}`);
      console.log(`   Slug: ${city.slug?.current || 'NO SLUG'}`);
      console.log(`   Image: ${city.mainImage?.asset?.url ? 'HAS IMAGE' : 'NO IMAGE'}`);
      if (city.mainImage?.asset?.url) {
        console.log(`   Image URL: ${city.mainImage.asset.url}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectData();
