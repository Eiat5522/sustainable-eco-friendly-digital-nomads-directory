const { getClient } = require('./app-next-directory/src/lib/sanity/client');

async function testSlugs() {
  try {
    const client = getClient();
    const listings = await client.fetch(`*[_type == "listing" && moderation.featured == true][0...5]{
      _id,
      name,
      "slug": slug.current,
      category,
      "city": city->name,
      "primaryImageUrl": primaryImage.asset->url
    }`);

    console.log('Featured listings with slugs:');
    console.log(JSON.stringify(listings, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

testSlugs();
