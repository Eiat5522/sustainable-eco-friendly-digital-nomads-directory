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
import { scheduledPublishing } from '@sanity/scheduled-publishing'
import { previewConfig } from './config/preview'
import { schemaTypes } from './schemas'
import { structure } from './structure'

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'

export default defineConfig({
  name: 'sustainable-nomads',
  title: 'Sustainable Digital Nomads Directory',
  projectId: 'sc70w3cr',
  dataset: 'production',

  plugins: [
    deskTool({
      structure,
      defaultDocumentNode: (S, { schemaType }) => {
        // Add preview functionality
        const previewView = S.view
          .component(({ document }) => (
            <iframe
              src={`${FRONTEND_URL}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&slug=${document?.slug?.current}&type=${schemaType}`}
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          ))
          .title('Preview')

        return S.document().views([S.view.form(), previewView])
      }
    }),
    visionTool(),
    media(),
    scheduledPublishing()
  ],

  schema: {
    types: schemaTypes
  },

  document: {
    // New document actions
    actions: (prev, { schemaType }) => {
      if (['listing', 'blogPost', 'event'].includes(schemaType)) {
        return prev.filter(action => action.action !== 'delete')
      }
      return prev
    },
    // Preview configuration
    preview: previewConfig
  }
})
