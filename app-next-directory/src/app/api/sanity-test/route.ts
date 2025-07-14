import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { client } from '@/lib/sanity/client';

export async function GET() {
  try {
    // Test Sanity connection
    console.log('Testing Sanity connection...');
    console.log('Sanity Config:', {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    });

    // Simple query to test connection
    const result = await client.fetch(`*[_type == "listing"][0...1] {
      _id,
      title
    }`);

    console.log('Test query result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Sanity connection successful',
      config: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      },
      testResult: result
    });
  } catch (error) {
    console.error('Sanity test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      }
    }, { status: 500 });
  }
}
