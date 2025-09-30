/**
 * Migration script to clean up orphan userFavorite documents
 * 
 * This script identifies and removes userFavorite documents that have:
 * - Missing user reference
 * - Missing listing reference
 * - Invalid/broken references
 * 
 * Run with: node migrate-orphan-favorites.js
 */

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2025-02-19',
  useCdn: false,
});

async function findOrphanFavorites() {
  console.log('🔍 Searching for orphan userFavorite documents...');
  
  // Find favorites with missing user or listing references
  const orphanFavorites = await client.fetch(`
    *[_type == "userFavorite" && (
      !defined(user._ref) || 
      !defined(listing._ref) ||
      user._ref == "" ||
      listing._ref == ""
    )] {
      _id,
      _rev,
      user,
      listing,
      createdAt
    }
  `);

  console.log(`Found ${orphanFavorites.length} favorites with missing references`);

  // Also check for favorites with broken references (references to non-existent documents)
  const favoritesWithBrokenRefs = await client.fetch(`
    *[_type == "userFavorite" && defined(user._ref) && defined(listing._ref)] {
      _id,
      _rev,
      "userExists": defined(*[_type == "user" && _id == ^.user._ref][0]),
      "listingExists": defined(*[_type == "listing" && _id == ^.listing._ref][0]),
      user,
      listing,
      createdAt
    }[!userExists || !listingExists]
  `);

  console.log(`Found ${favoritesWithBrokenRefs.length} favorites with broken references`);

  const allOrphans = [...orphanFavorites, ...favoritesWithBrokenRefs];
  const uniqueOrphans = Array.from(new Map(allOrphans.map(item => [item._id, item])).values());
  return uniqueOrphans;
}

async function cleanupOrphanFavorites(dryRun = true) {
  const orphans = await findOrphanFavorites();
  
  if (orphans.length === 0) {
    console.log('✅ No orphan favorites found. Database is clean!');
    return;
  }

  console.log('\n📋 Orphan favorites summary:');
  orphans.forEach((favorite, index) => {
    console.log(`${index + 1}. ID: ${favorite._id}`);
    console.log(`   User: ${favorite.user?._ref || 'MISSING'}`);
    console.log(`   Listing: ${favorite.listing?._ref || 'MISSING'}`);
    console.log(`   Created: ${favorite.createdAt || 'Unknown'}`);
    console.log('');
  });

  if (dryRun) {
    console.log('🔒 DRY RUN MODE: No changes will be made.');
    console.log('To actually delete these orphan favorites, run with --delete flag');
    return { dryRun: true, orphans, deletedCount: 0 };
  }
  console.log('🗑️ Deleting orphan favorites...');
  
  const BATCH_SIZE = 100;
  const results = [];
  
  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE);
    const transaction = client.transaction();
    batch.forEach(favorite => {
      transaction.delete(favorite._id);
    });
  
    try {
      const result = await transaction.commit();
      results.push(result);
      console.log(`✅ Deleted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)`);
    } catch (error) {
      console.error(`❌ Error deleting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Successfully deleted ${orphans.length} orphan favorites`);
  return results;
}

  try {
    const result = await transaction.commit();
    console.log(`✅ Successfully deleted ${orphans.length} orphan favorites`);
    return { dryRun: false, orphans, deletedCount: orphans.length, result };
  } catch (error) {
    console.error('❌ Error deleting orphan favorites:', error);
    throw error;
  }
}

async function validateFavoritesIntegrity() {
  console.log('🔍 Validating userFavorite collection integrity...');
  
  const stats = await client.fetch(`
    {
      "totalFavorites": count(*[_type == "userFavorite"]),
      "favoritesWithUser": count(*[_type == "userFavorite" && defined(user._ref) && user._ref != ""]),
      "favoritesWithListing": count(*[_type == "userFavorite" && defined(listing._ref) && listing._ref != ""]),
      "favoritesWithBothRefs": count(*[_type == "userFavorite" && defined(user._ref) && defined(listing._ref) && user._ref != "" && listing._ref != ""])
    }
  `);

  console.log('\n📊 Favorites Collection Stats:');
  console.log(`Total favorites: ${stats.totalFavorites}`);
  console.log(`With user reference: ${stats.favoritesWithUser}`);
  console.log(`With listing reference: ${stats.favoritesWithListing}`);
  console.log(`With both references: ${stats.favoritesWithBothRefs}`);

  const orphanCount = stats.totalFavorites - stats.favoritesWithBothRefs;
  if (orphanCount === 0) {
    console.log('✅ All favorites have valid user and listing references');
  } else {
    console.log(`⚠️ ${orphanCount} favorites have missing or invalid references`);
  }

  return stats;
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');
  const shouldValidateOnly = args.includes('--validate');

  async function main() {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        console.error('❌ SANITY_API_TOKEN environment variable is required');
        process.exit(1);
      }
      if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
        console.error('❌ NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is required');
        process.exit(1);
      }
      if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
        console.error('❌ NEXT_PUBLIC_SANITY_DATASET environment variable is required');
        process.exit(1);
      }

      if (shouldValidateOnly) {
        await validateFavoritesIntegrity();
      } else {
        await validateFavoritesIntegrity();
        console.log('\n' + '='.repeat(50));
        await cleanupOrphanFavorites(!shouldDelete);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  main();
}

export { findOrphanFavorites, cleanupOrphanFavorites, validateFavoritesIntegrity };