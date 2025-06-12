const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

// Create client with write permissions
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-05-16',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN // Write token needed for updates
});

/**
 * Generate a clean slug from a name
 */
function generateSlugFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 96); // Sanity slug max length
}

/**
 * Ensure slug uniqueness by appending numbers if needed
 */
async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await client.fetch(
      `*[_type == "listing" && slug.current == $slug && _id != $excludeId][0]`,
      { slug, excludeId }
    );

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Update a single listing's slug
 */
async function updateListingSlug(listing) {
  try {
    const baseSlug = generateSlugFromName(listing.name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, listing._id);

    await client
      .patch(listing._id)
      .set({
        slug: {
          _type: 'slug',
          current: uniqueSlug
        }
      })
      .commit();

    console.log(`✅ Updated "${listing.name}": ${listing.slug} → ${uniqueSlug}`);
    return { success: true, oldSlug: listing.slug, newSlug: uniqueSlug };
  } catch (error) {
    console.error(`❌ Failed to update "${listing.name}":`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateListingSlugs() {
  console.log('🔄 Starting listing slug migration...\n');

  try {
    // Fetch all listings with problematic slugs
    console.log('📋 Fetching listings with generate-uuid-for slugs...');
    const listings = await client.fetch(`
      *[_type == "listing" && slug.current match "generate-uuid-for-*"] {
        _id,
        name,
        "slug": slug.current,
        category,
        "city": city->title
      }
    `);

    if (listings.length === 0) {
      console.log('✅ No listings found with generate-uuid-for slugs. Migration not needed.');
      return;
    }

    console.log(`📊 Found ${listings.length} listings to update:\n`);

    // Show preview of changes
    for (const listing of listings) {
      const baseSlug = generateSlugFromName(listing.name);
      console.log(`   "${listing.name}" → ${baseSlug}`);
    }

    console.log('\n🚀 Starting migration...\n');

    // Update each listing
    const results = [];
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`[${i + 1}/${listings.length}] Processing "${listing.name}"...`);

      const result = await updateListingSlug(listing);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully updated: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed updates:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.error}`);
      });
    }

    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateListingSlugs()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateListingSlugs, generateSlugFromName, ensureUniqueSlug };
