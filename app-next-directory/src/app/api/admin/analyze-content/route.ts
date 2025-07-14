import { authOptions } from '@/lib/auth';
import analyzeContent from '@/scripts/analyze-content';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function GET() {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = await analyzeContent();

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        thinContentCount: results.thinContent.length,
        duplicateContentCount: results.duplicateContent.length,
        missingMetadataCount: results.missingMetadata.length,
      }
    });
  } catch (error) {
    console.error('Content analysis error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}
