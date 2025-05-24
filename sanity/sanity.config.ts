import { codeInput } from '@sanity/code-input'; // Import codeInput
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'default',
  title: 'sustainable-nomads',

  projectId: 'sc70w3cr',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), codeInput()], // Add codeInput to plugins

  schema: {
    types: schemaTypes,
  },
});
