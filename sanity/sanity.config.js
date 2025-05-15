/**
 * Sanity Configuration
 * 
 * This is the main configuration file for the Sanity Studio.
 * See https://www.sanity.io/docs/configuration for more info.
 */

import { defineConfig, isDev } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { media } from 'sanity-plugin-media'
import { scheduledPublishing, ScheduleAction, ScheduledBadge } from '@sanity/scheduled-publishing'
import { previewConfig } from './config/preview'
import { schemaTypes } from './schemas'
import { structure } from './structure'
import DOMPurify from 'dompurify'

// Import XSS protection for PrismJS - May 16, 2025
import './scripts/load-prismjs-protection'

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  'https://your-production-domain.com',
  'https://your-staging-domain.com'
].filter(Boolean)

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'X-XSS-Protection': '1; mode=block'
}

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
    }),
    // Only enable Vision tool in development or for administrators
    ...(isDev ? [visionTool({
      defaultApiVersion: '2025-05-15',
      defaultDataset: 'production',
      securityHeaders: SECURITY_HEADERS
    })] : []),
    media(),
    scheduledPublishing({
      enabled: true,
      inputDateTimeFormat: 'MM/dd/yyyy h:mm a',
      // Only allow admins and editors to schedule content
      permissions: ({ currentUser }) => {
        return currentUser?.roles?.some(role => 
          ['administrator', 'editor'].includes(role.name)
        )
      }
    })
  ],

  schema: {
    types: schemaTypes
  },

  document: {
    // Enhanced document actions with role-based access
    actions: (prev, { schemaType, currentUser }) => {
      // Filter actions based on user role
      const isAdmin = currentUser?.roles?.some(role => role.name === 'administrator')
      const isEditor = currentUser?.roles?.some(role => role.name === 'editor')
      
      let actions = prev

      // Remove delete action for certain schema types
      if (['listing', 'blogPost', 'event'].includes(schemaType)) {
        actions = actions.filter(action => action.action !== 'delete')
      }

      // Only show schedule action for admins and editors
      if (!isAdmin && !isEditor) {
        actions = actions.filter(action => action !== ScheduleAction)
      }

      return actions
    },
    // Only show schedule badge for admins and editors
    badges: (prev, { schemaType, currentUser }) => {
      const isAdmin = currentUser?.roles?.some(role => role.name === 'administrator')
      const isEditor = currentUser?.roles?.some(role => role.name === 'editor')

      if (!isAdmin && !isEditor) {
        return prev.filter(badge => badge !== ScheduledBadge)
      }
      return prev
    },
    preview: previewConfig
  },

  // Enhanced security and performance optimizations
  api: {
    projectId: 'sc70w3cr',
    dataset: 'production',
    useCdn: process.env.NODE_ENV === 'production',
    withCredentials: true,
    cors: {
      credentials: true,
      origin: ALLOWED_ORIGINS,
      headers: Object.keys(SECURITY_HEADERS),
    },
    maxRequestsPerSecond: 100, // Rate limiting
  },

  form: {
    image: {
      assetSources: [
        { name: 'media-library', title: 'Media Library' },
        { name: 'asset-library', title: 'Asset Library' }
      ],
      // Enable file type validation
      accept: 'image/jpeg, image/png, image/webp, image/gif',
      directUploads: true,
      // Add file size limits
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    file: {
      assetSources: ['media-library', 'asset-library'],
      // Enable file type validation
      accept: '.pdf,.doc,.docx,.txt',
      directUploads: true,
      // Add file size limits
      maxSize: 10 * 1024 * 1024 // 10MB
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
