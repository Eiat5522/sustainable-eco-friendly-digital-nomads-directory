import { promises as fs } from 'fs';
import path from 'path';
import { type Listing } from '@/types/listings';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/listings.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const listings: Listing[] = JSON.parse(fileContent);
    
    return ApiResponseHandler.success({ listings });
  } catch (error) {
    console.error('Error reading legacy listings:', error);
    return ApiResponseHandler.error('Failed to load listings', 500);
  }
}
