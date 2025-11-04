import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'

const config = {
  name: 'econmads',
  title: 'EcoNomads',

  projectId: 'sc70w3cr',
  dataset: 'production',

  plugins: [deskTool()],

  schema: {
    types: [],
  },

  basePath: '/studio',
} satisfies Parameters<typeof defineConfig>[0]

export default defineConfig(config)
