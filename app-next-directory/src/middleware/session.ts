// NOTE: Do not import NextRequest/NextResponse from 'next/server' in utility files for Next.js 14+ middleware compatibility.

  // Temporarily disabled session tracking
  return { next: () => ({}) };
}
