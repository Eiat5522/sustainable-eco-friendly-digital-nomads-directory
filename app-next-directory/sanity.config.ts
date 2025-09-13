import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'

// Cast to `any` to avoid exposing private plugin option types in d.ts
const config = defineConfig({
  name: 'econmads',
  title: 'EcoNomads',
  
  projectId: 'sc70w3cr',
  dataset: 'production',
  
  plugins: [deskTool()],
  
  schema: {
    types: [],
  },

  basePath: '/studio',
} as any)

export default config
