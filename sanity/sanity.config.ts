import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemas'; // Changed from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'sustainable-nomads',

  projectId: 'sc70w3cr',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
