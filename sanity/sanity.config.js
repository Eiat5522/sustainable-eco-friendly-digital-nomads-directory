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
import DOMPurify from 'dompurify'

// Import XSS protection for PrismJS - May 15, 2025
import './scripts/load-prismjs-protection'

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'

const config = defineConfig({
  name: 'sustainable-nomads',
  title: 'Sustainable Digital Nomads Directory',
  projectId: 'sc70w3cr',
  dataset: 'production',
    plugins: [
    deskTool({
      structure,
      defaultDocumentNode: (S, { schemaType }) => {
        const previewView = S.view
          .component(({ document }) => (
            <iframe
              src={`${FRONTEND_URL}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&slug=${document?.slug?.current}&type=${schemaType}`}
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          ))
          .title('Preview')

        // Different preview configurations based on schema type
        const views = [S.view.form()]
        
        if (['listing', 'blogPost', 'event'].includes(schemaType)) {
          views.push(previewView)
        }

        return S.document().views(views)
      }
    }),visionTool({
      defaultApiVersion: '2025-05-15',
      defaultDataset: 'production',
      securityHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }),
    media(),
    scheduledPublishing({
      enabled: true,
      inputDateTimeFormat: 'MM/dd/yyyy h:mm a'
    })
  ],

  schema: {
    types: schemaTypes
  },

  document: {
    // Enhanced document actions
    actions: (prev, { schemaType }) => {
      if (['listing', 'blogPost', 'event'].includes(schemaType)) {
        return prev.filter(action => action.action !== 'delete')
      }
      return prev
    },
    preview: previewConfig
  },

  // Added security and performance optimizations
  api: {
    projectId: 'sc70w3cr',
    dataset: 'production',
    useCdn: process.env.NODE_ENV === 'production',
    withCredentials: true,
  },

  form: {
    image: {
      assetSources: [
        { name: 'media-library', title: 'Media Library' },
        { name: 'asset-library', title: 'Asset Library' }
      ],
      directUploads: true
    },
    file: {
      assetSources: ['media-library', 'asset-library'],
      directUploads: true
    }
  },
  security: {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'media-src': ["'self'", 'data:', 'https:', 'blob:'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'frame-ancestors': ["'self'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'connect-src': ["'self'", 'https:', 'wss:'],
        'worker-src': ["'self'", 'blob:'],
        'form-action': ["'self'"]
      }
    },
    cors: {
      origin: [process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'],
      credentials: true,
      headers: ['Origin', 'Content-Type', 'Authorization', 'Accept'],
    },
    corsOrigins: [process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'],
    authentication: {
      requireLogin: process.env.NODE_ENV === 'production',
      providers: {
        github: {
          enabled: false
        },
        google: {
          enabled: false
        }
      }
    },
    sessionCookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  },
  forms: {
    // Input sanitization for rich text fields
    richText: {
      beforeInsert: (value) => {
        if (typeof value === 'string') {
          return DOMPurify.sanitize(value, {
            FORBID_TAGS: ['script', 'style', 'iframe', 'object'],
            FORBID_ATTR: ['onclick', 'onload', 'onerror']
          });
        }
        return value;
      }
    }
  },
  // API versioning
  apiVersion: '2025-05-15',
  // Document versioning
  documentVersioning: true,
})

export default config
