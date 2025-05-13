/**
 * Sanity Configuration
 * 
 * This is the main configuration file for the Sanity Studio.
 * See https://www.sanity.io/docs/configuration for more info.
 */

import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { media } from 'sanity-plugin-media'
import { schemaTypes } from './schemas'
import { structure } from './structure'


export default defineConfig({
  name: 'default',
  title: 'Sustainable Digital Nomads Directory',
  projectId: 'sc70w3cr', // Your real Sanity project ID
  dataset: 'production',

  plugins: [
    deskTool({
      structure
    }),
    visionTool(),
    media()
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // For showing the preview button in the studio
    productionUrl: async (prev, context) => {
      const { document } = context
      if (document._type === 'listing') {
        return `${process.env.NEXT_PUBLIC_SITE_URL}/listings/${document.slug.current}`
      }
      if (document._type === 'city') {
        return `${process.env.NEXT_PUBLIC_SITE_URL}/listings?city=${document.slug.current}`
      }
      return prev
    }
  }
})
