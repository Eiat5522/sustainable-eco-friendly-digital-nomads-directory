import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Sanity client
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_TEST_TOKEN,
  apiVersion: process.env.SANITY_STUDIO_API_VERSION,
  useCdn: false,
});

// Path to your images folder
const IMAGES_DIR = path.join(__dirname, '../../app-scaffold/public/images/cities');

// Function to upload a single image
async function uploadImage(filePath) {
  try {
    console.log(`Reading file: ${filePath}`);
    const imageBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    console.log(`Uploading ${fileName} to Sanity...`);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: fileName
    });

    console.log(`Successfully uploaded ${fileName}`);
    console.log(`Asset ID: ${asset._id}`);
    return {
      fileName,
      assetId: asset._id
    };
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    return null;
  }
}

// Function to upload all images in the directory
async function uploadAllImages() {
  try {
    // Check if directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`Directory not found: ${IMAGES_DIR}`);
      return;
    }

    // Read all files in the directory
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (files.length === 0) {
      console.log('No image files found in the directory.');
      return;
    }

    console.log(`Found ${files.length} image files. Starting upload...`);

    // Upload each image and collect results
    const results = [];
    for (const file of files) {
      const filePath = path.join(IMAGES_DIR, file);
      const result = await uploadImage(filePath);
      if (result) {
        results.push(result);
      }
    }

    // Save the results to a JSON file for reference
    const outputPath = path.join(__dirname, 'image-upload-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nUpload complete! Results saved to: ${outputPath}`);
    console.log('\nUse these asset IDs in your cities_to_import.ndjson file.');

  } catch (error) {
    console.error('Error in uploadAllImages:', error.message);
  }
}

// Run the upload
uploadAllImages();
