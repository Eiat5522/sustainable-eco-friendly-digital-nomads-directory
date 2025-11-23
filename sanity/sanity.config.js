import { codeInput } from '@sanity/code-input'; // Import codeInput
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'sc70w3cr';
const dataset =
  process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'default',
  title: 'sustainable-nomads',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool(), codeInput()], // Add codeInput to plugins
  schema: {
    types: schemaTypes,
  },
});
