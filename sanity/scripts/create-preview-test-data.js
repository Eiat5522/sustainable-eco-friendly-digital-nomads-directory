import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function createPreviewTestData() {
  try {
    // Create test draft listing
    const listing = await client.create({
      _type: 'listing',
      _id: 'test-draft-listing',
      title: 'Test Draft Listing',
      description: 'This is a test draft listing for preview mode testing',
      slug: {
        _type: 'slug',
        current: 'test-draft-listing'
      },
      isDraft: true,
      status: 'draft',
      location: {
        city: 'Test City',
        country: 'Test Country'
      },
      amenities: ['wifi', 'coworking'],
      sustainabilityFeatures: ['solar-power', 'water-conservation'],
      priceRange: {
        min: 500,
        max: 1000,
        currency: 'USD'
      }
    });

    console.log('Created test draft listing:', listing._id);

    // Create test draft city
    const city = await client.create({
      _type: 'city',
      _id: 'test-draft-city',
      name: 'Test Draft City',
      slug: {
        _type: 'slug',
        current: 'test-draft-city'
      },
      isDraft: true,
      status: 'draft',
      country: 'Test Country',
      description: 'This is a test draft city for preview mode testing',
      population: 100000,
      climateInfo: {
        averageTemperature: 25,
        seasonality: 'Moderate'
      },
      sustainabilityScore: 8.5,
      nomadScore: 9.0,
      costOfLiving: {
        overall: 'Medium',
        monthlyEstimate: {
          min: 1000,
          max: 2000,
          currency: 'USD'
        }
      }
    });

    console.log('Created test draft city:', city._id);

    console.log('Preview test data created successfully');
  } catch (error) {
    console.error('Error creating preview test data:', error);
    process.exit(1);
  }
}

async function cleanupPreviewTestData() {
  try {
    // Delete test documents if they exist
    await client.delete('test-draft-listing').catch(() => {});
    await client.delete('test-draft-city').catch(() => {});

    console.log('Cleaned up previous test data');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

// Run the script
(async () => {
  console.log('Creating preview test data...');
  await cleanupPreviewTestData();
  await createPreviewTestData();
})();
