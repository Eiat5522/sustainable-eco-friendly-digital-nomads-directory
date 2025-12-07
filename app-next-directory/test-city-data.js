// Test script to verify Sanity city data and image URLs
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function testCityData() {
  try {
    console.log('Testing Sanity connection...');
    console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
    console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);

    const query = `*[_type == "city"] {
      _id,
      title,
      description,
      "slug": slug.current,
      mainImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      },
      country,
      sustainabilityScore,
      highlights
    }`;

    const cities = await client.fetch(query);
    console.log('\n=== CITIES DATA ===');
    console.log(`Found ${cities.length} cities`);

    cities.forEach((city, index) => {
      console.log(`\nCity ${index + 1}:`);
      console.log('- ID:', city._id);
      console.log('- Title:', city.title);
      console.log('- Slug:', city.slug);
      console.log('- Country:', city.country);
      console.log('- Sustainability Score:', city.sustainabilityScore);
      console.log('- Highlights:', city.highlights?.join(', ') || 'None');

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
