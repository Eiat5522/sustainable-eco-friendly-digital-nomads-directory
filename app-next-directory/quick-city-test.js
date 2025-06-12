const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-05-16',
  useCdn: false,
});

async function quickCityTest() {
  try {
    const cityResult = await client.fetch(`*[_type == "city"][0] { _id, name, title }`);
    console.log('City fields:', JSON.stringify(cityResult, null, 2));

    const result = await client.fetch(`
      *[_type == "listing" && moderation.featured == true][0] {
        _id,
        name,
        city,
        "cityRef": city->_id,
        "cityTitle": city->title,
        "cityName": city->name
      }
    `);
    console.log('Listing with city:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickCityTest();
