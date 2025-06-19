const { getClient } = require('./src/lib/sanity/client');

async function checkCities() {
  try {
    const client = getClient();
    
    const cities = await client.fetch(`
      *[_type == "city"] {
        _id,
        title,
        "slug": slug.current,
        description,
        mainImage {
          asset->{
            url
          }
        }
      }
    `);
    
    console.log('Available cities:');
    cities.forEach((city, index) => {
      console.log(`${index + 1}. ${city.title} (slug: ${city.slug})`);
    });
    
    if (cities.length > 0) {
      console.log('\nFirst city details:');
      console.log(JSON.stringify(cities[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error fetching cities:', error);
  }
}

checkCities();
