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
    console.log('🔍 Debugging city references and images...\n');

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

    console.log('📋 Detailed listing analysis:');
    listings.forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.name}`);
      console.log(`   City Reference:`, listing.cityRef?._ref || 'NO REF');
      console.log(`   City Title:`, listing.cityTitle || 'NO TITLE');
      console.log(`   City Name:`, listing.cityName || 'NO NAME');
      console.log(`   Primary Image Exists:`, listing.primaryImageExists);
      console.log(`   Primary Image URL:`, listing.primaryImageUrl ? 'PRESENT' : 'MISSING');
      console.log(`   Gallery Count:`, listing.galleryCount || 0);
      console.log(`   Featured Status:`, listing.moderation?.featured);
    });

    // Check available cities separately
    console.log('\n🏙️ Available cities in dataset:');
    const cities = await client.fetch(`
      *[_type == "city"][0...5] {
        _id,
        title,
        name,
        "slug": slug.current
      }
    `);

    cities.forEach((city, index) => {
      console.log(`${index + 1}. Title: "${city.title}", Name: "${city.name}", ID: ${city._id}`);
    });

    // Test if city references are broken
    console.log('\n🔗 Checking city reference integrity:');
    const referencedCities = await client.fetch(`
      *[_type == "listing" && defined(city) && moderation.featured == true] {
        "listingName": name,
        "cityRefId": city._ref,
        "cityExists": defined(*[_type == "city" && _id == ^.city._ref][0])
      }
    `);

    referencedCities.forEach((ref, index) => {
      console.log(`${index + 1}. ${ref.listingName} → City ID: ${ref.cityRefId}, Exists: ${ref.cityExists}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCityAndImages();
