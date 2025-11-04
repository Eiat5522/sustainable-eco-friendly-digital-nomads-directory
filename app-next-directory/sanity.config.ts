import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'

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
})

export default defineConfig(config)
