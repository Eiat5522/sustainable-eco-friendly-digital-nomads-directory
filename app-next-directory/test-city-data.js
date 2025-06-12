// Test script to inspect city references in listings
const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-05-16',
  useCdn: false,
});

async function inspectCityReferences() {
  try {
    console.log('🔍 Inspecting city references in listings...\n');

    // Check raw city field structure
    const listingsWithCityData = await client.fetch(`
      *[_type == "listing" && moderation.featured == true][0...3] {
        _id,
        name,
        city,
        "cityRef": city->_id,
        "cityTitle": city->title,
        "cityName": city->name,
        "rawCity": city
      }
    `);

    console.log('📋 Featured listings city data:');
    listingsWithCityData.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.name}`);
      console.log(`   Raw City Field:`, listing.rawCity);
      console.log(`   City Ref ID:`, listing.cityRef || 'NO REF');
      console.log(`   City Title:`, listing.cityTitle || 'NO TITLE');
      console.log(`   City Name:`, listing.cityName || 'NO NAME');
      console.log('');
    });

    // Check available cities
    console.log('🏙️ Available cities in Sanity:');
    const cities = await client.fetch(`
      *[_type == "city"][0...5] {
        _id,
        name,
        title,
        slug
      }
    `);

    cities.forEach((city, index) => {
      console.log(`${index + 1}. ${city.title || city.name} (ID: ${city._id})`);
    });

      if (city.mainImage?.asset) {
        console.log('- Image Asset ID:', city.mainImage.asset._id);
        console.log('- Image URL:', city.mainImage.asset.url);
        console.log('- Image Dimensions:',
          `${city.mainImage.asset.metadata?.dimensions?.width}x${city.mainImage.asset.metadata?.dimensions?.height}`);
      } else {
        console.log('- Image: No image data');
      }
    });

    return cities;
  } catch (error) {
    console.error('Error fetching city data:', error);
    throw error;
  }
}

// Test image URL generation
async function testImageUrls() {
  try {
    const cities = await testCityData();

    if (cities.length > 0) {
      console.log('\n=== TESTING IMAGE URL GENERATION ===');

      for (const city of cities) {
        if (city.mainImage?.asset) {
          const imageUrl = city.mainImage.asset.url;
          console.log(`\nTesting image for ${city.title}:`);
          console.log('Original URL:', imageUrl);

          // Test if URL is accessible
          try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            console.log('Image accessibility:', response.ok ? 'OK' : `Failed (${response.status})`);
          } catch (fetchError) {
            console.log('Image accessibility: Failed to fetch -', fetchError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error testing image URLs:', error);
  }
}

// Run the test
if (require.main === module) {
  testImageUrls().then(() => {
    console.log('\nTest completed');
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testCityData, testImageUrls };
