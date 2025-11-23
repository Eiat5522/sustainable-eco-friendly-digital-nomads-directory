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
        primaryImage {
          asset->{
            url
          }
        }
      }
    `);
    cities.forEach((_city, _index) => {});

    if (cities.length > 0) {
    }
  } catch (_error) {}
}

checkCities();
