import fs from 'fs';
import path from 'path';

export function getListingImages(listingId) {
  try {
    // Define the path based on listingId (e.g., public/images/listings/<listingId>)
    // Note: process.cwd() might point to the root, not app-next-directory, adjust if needed
    // Assuming execution context is project root where app-next-directory resides
    // process.cwd() likely points to the app-next-directory directory already in Next.js context
    const listingDir = path.join(process.cwd(), 'public', 'images', 'listings', listingId);
    // Read contents of the directory
    const files = fs.readdirSync(listingDir);
    // Filter for image files (adjust regex as needed)
    const imageFiles = files.filter(file => /\.(jpe?g|png|svg)$/i.test(file));
    // Construct public URLs (assuming Next.js serves 'app-next-directory/public' at the base URL)
    const imagePaths = imageFiles.map(file => `/images/listings/${listingId}/${file}`);
    return imagePaths;
  } catch (error) {
    // Log the error for debugging (optional)
    console.error(`Error reading images for listing ${listingId}:`, error.message);
    // Return an empty array if the directory doesn't exist or another error occurs
    return [];
  }
}
