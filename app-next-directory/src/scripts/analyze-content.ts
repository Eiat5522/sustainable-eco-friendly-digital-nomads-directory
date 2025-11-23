import { promises as fs } from 'fs';
import path from 'path';
import stringSimilarity from 'string-similarity';
import { getClient } from '../lib/sanity/client';

interface ContentAnalysisResult {
  thinContent: {
    listingId: string;
    listingName: string;
    wordCount: number;
    reason: string;
  }[];
  duplicateContent: {
    listing1Id: string;
    listing1Name: string;
    listing2Id: string;
    listing2Name: string;
    similarity: number;
  }[];
  missingMetadata: {
    listingId: string;
    listingName: string;
    missingFields: string[];
  }[];
}

const MINIMUM_DESCRIPTION_WORDS = 50;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.8;
const REQUIRED_METADATA_FIELDS = [
  'name',
  'description_short',
  'description_long',
  'primary_image_url',
  'eco_features',
  'amenities',
  'category',
  'city',
];

async function analyzeContent(): Promise<ContentAnalysisResult> {
  const client = getClient();

  // Fetch all listings with their content
  const listings = await client.fetch(`
    *[_type == "listing"]{
      _id,
      name,
      description_short,
      description_long,
      primary_image_url,
      eco_features,
      amenities,
      category,
      "city": city->name
    }
  `);

  const result: ContentAnalysisResult = {
    thinContent: [],
    duplicateContent: [],
    missingMetadata: [],
  };

  // Check each listing
  listings.forEach((listing: any) => {
    // Check for thin content
    const description = `${listing.description_short} ${listing.description_long}`;
    const wordCount = description.split(/\s+/).length;

    if (wordCount < MINIMUM_DESCRIPTION_WORDS) {
      result.thinContent.push({
        listingId: listing._id,
        listingName: listing.name,
        wordCount,
        reason: `Description contains only ${wordCount} words (minimum: ${MINIMUM_DESCRIPTION_WORDS})`,
      });
    }

    // Check for missing metadata
    const missingFields = REQUIRED_METADATA_FIELDS.filter(
      (field) => !listing[field] ||
        (Array.isArray(listing[field]) && listing[field].length === 0)
    );

    if (missingFields.length > 0) {
      result.missingMetadata.push({
        listingId: listing._id,
        listingName: listing.name,
        missingFields,
      });
    }
  });

  // Check for duplicate content
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const listing1 = listings[i];
      const listing2 = listings[j];

      const text1 = `${listing1.description_short} ${listing1.description_long}`;
      const text2 = `${listing2.description_short} ${listing2.description_long}`;

      const similarity = stringSimilarity.compareTwoStrings(text1, text2);

      if (similarity > DUPLICATE_SIMILARITY_THRESHOLD) {
        result.duplicateContent.push({
          listing1Id: listing1._id,
          listing1Name: listing1.name,
          listing2Id: listing2._id,
          listing2Name: listing2.name,
          similarity,
        });
      }
    }
  }

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultPath = path.join(process.cwd(), 'reports', `content-analysis-${timestamp}.json`);
  await fs.mkdir(path.dirname(resultPath), { recursive: true });
  await fs.writeFile(resultPath, JSON.stringify(result, null, 2));

  return result;
}

export default analyzeContent;
