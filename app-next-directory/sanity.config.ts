import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';

export default defineConfig({
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
