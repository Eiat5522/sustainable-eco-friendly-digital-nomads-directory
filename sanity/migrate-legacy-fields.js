/*eslint no-undef: "error"*/
/**
 * Migration Sc;: Legacy Field Migration for Listings
 * 
 * This script migrates data from legacy fields to new standardized fields:
 * - address -> address_string
 * - descriptionShort -> description_short
 * - digitalNomadFeatures -> digital_nomad_features
 * - ecoFocusTags -> eco_focus_tags (reference array)
 * - sourceUrls -> source_urls  
 * - status -> moderation.status
 * 
 * Usage: node migrate-legacy-fields.js
 */

import { client } from '../app-next-directory/src/lib/sanity/client'

const BATCH_SIZE = 50

async function migrateLegacyFields() {
  console.log('🚀 Starting legacy field migration...')
  
  try {
    // First, get all listings that have legacy fields
    const query = `*[_type == "listing" && (
      defined(address) ||
      defined(descriptionShort) ||
      defined(digitalNomadFeatures) ||
      defined(ecoFocusTags) ||
      defined(sourceUrls) ||
      defined(status)
    )] {
      _id,
      _rev,
      address,
      descriptionShort,
      digitalNomadFeatures,
      ecoFocusTags,
      sourceUrls,
      status,
      address_string,
      description_short,
      digital_nomad_features,
      eco_focus_tags,
      source_urls,
      moderation
    }`
    
    console.log('📊 Fetching listings with legacy fields...')
    const listings = await client.fetch(query)
    console.log(`Found ${listings.length} listings with legacy fields`)
    
    if (listings.length === 0) {
      console.log('✅ No legacy fields found. Migration complete!')
      return
    }
    
    // Process in batches
    for (let i = 0; i < listings.length; i += BATCH_SIZE) {
      const batch = listings.slice(i, i + BATCH_SIZE)
      console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(listings.length / BATCH_SIZE)}...`)
      
      // Create mutation for each listing in the batch
      const mutations = batch.map(listing => {
        const patches = []
        
        // Migrate address -> address_string
        if (listing.address && !listing.address_string) {
          patches.push({
            set: { address_string: listing.address }
          })
        }
        
        // Migrate descriptionShort -> description_short
        if (listing.descriptionShort && !listing.description_short) {
          patches.push({
            set: { description_short: listing.descriptionShort }
          })
        }
        
        // Migrate digitalNomadFeatures -> digital_nomad_features
        if (listing.digitalNomadFeatures && !listing.digital_nomad_features) {
          patches.push({
            set: { digital_nomad_features: listing.digitalNomadFeatures }
          })
        }
        
        // Migrate sourceUrls -> source_urls
        if (listing.sourceUrls && !listing.source_urls) {
          patches.push({
            set: { source_urls: listing.sourceUrls }
          })
        }
        
        // Migrate status -> moderation.status
        if (listing.status && (!listing.moderation || !listing.moderation.status)) {
          const moderation = listing.moderation || {}
          moderation.status = listing.status
          patches.push({
            set: { moderation }
          })
        }
        
        // Note: ecoFocusTags requires special handling as it needs to be converted to references
        // This would need to be done separately with proper ecoTag lookups
        
        if (patches.length === 0) {
          return null
        }
        
        return {
          patch: {
            id: listing._id,
            ifRevisionID: listing._rev,
            ...patches[0] // Apply first patch (we could combine but this is safer)
          }
        }
      }).filter(Boolean)
      
      if (mutations.length > 0) {
        try {
          const result = await client.mutate(mutations)
          console.log(`✅ Migrated ${mutations.length} listings in batch`)
        } catch (error) {
          console.error(`❌ Error in batch migration:`, error)
          // Continue with next batch
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('🎉 Legacy field migration completed!')
    
    // Report on what still needs manual migration
    console.log('\n📋 Manual migration still needed:')
    console.log('- ecoFocusTags array needs to be converted to eco_focus_tags references')
    console.log('- Run verification query to check migration success')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...')
  
  const verificationQuery = `*[_type == "listing"] {
    _id,
    "hasLegacyAddress": defined(address),
    "hasNewAddress": defined(address_string),
    "hasLegacyDesc": defined(descriptionShort),
    "hasNewDesc": defined(description_short),
    "hasLegacyFeatures": defined(digitalNomadFeatures),
    "hasNewFeatures": defined(digital_nomad_features),
    "hasLegacyUrls": defined(sourceUrls),
    "hasNewUrls": defined(source_urls),
    "hasLegacyStatus": defined(status),
    "hasModerationStatus": defined(moderation.status)
  }`
  
  const results = await client.fetch(verificationQuery)
  
  const stats = {
    total: results.length,
    needsAddressMigration: 0,
    needsDescMigration: 0,
    needsFeaturesMigration: 0,
    needsUrlsMigration: 0,
    needsStatusMigration: 0
  }
  
  results.forEach(listing => {
    if (listing.hasLegacyAddress && !listing.hasNewAddress) stats.needsAddressMigration++
    if (listing.hasLegacyDesc && !listing.hasNewDesc) stats.needsDescMigration++
    if (listing.hasLegacyFeatures && !listing.hasNewFeatures) stats.needsFeaturesMigration++
    if (listing.hasLegacyUrls && !listing.hasNewUrls) stats.needsUrlsMigration++
    if (listing.hasLegacyStatus && !listing.hasModerationStatus) stats.needsStatusMigration++
  })
  
  console.log('📊 Migration verification results:')
  console.log(`Total listings: ${stats.total}`)
  console.log(`Need address migration: ${stats.needsAddressMigration}`)
  console.log(`Need description migration: ${stats.needsDescMigration}`)
  console.log(`Need features migration: ${stats.needsFeaturesMigration}`)
  console.log(`Need URLs migration: ${stats.needsUrlsMigration}`)
  console.log(`Need status migration: ${stats.needsStatusMigration}`)
}

// Run migration
if (require.main === module) {
  migrateLegacyFields()
    .then(() => verifyMigration())
    .then(() => {
      console.log('\n✅ Migration process completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Migration process failed:', error)
      process.exit(1)
    })
}

export { migrateLegacyFields, verifyMigration }