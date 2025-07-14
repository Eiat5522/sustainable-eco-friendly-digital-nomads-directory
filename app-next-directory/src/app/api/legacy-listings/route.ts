import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { type Listing } from '@/types/listings';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/listings.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const listings: Listing[] = JSON.parse(fileContent);
    
    return NextResponse.json({ status: 'success', data: listings });
  } catch (error) {
    console.error('Error reading legacy listings:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to load listings' },
      { status: 500 }
    );
  }
}
