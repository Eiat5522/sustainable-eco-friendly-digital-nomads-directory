import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { analyzeContent } from '@/lib/admin/analytics';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { role?: UserRole } | undefined;

function ensureAdmin(sessionUser: SessionUser) {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function GET(request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') ?? 'listing';
    const windowDaysParam = url.searchParams.get('windowDays');
    const windowDays = windowDaysParam ? Number(windowDaysParam) : undefined;

    const analysis = await analyzeContent({ type, windowDays });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Admin content analysis GET error:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}

const FLAGGED_KEYWORDS = ['spam', 'fake', 'scam', 'prohibited'];

type Sample = { id: string; text: string };

type AnalyzeRequestBody = {
  type?: string;
  samples?: Sample[];
};

export async function POST(request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as AnalyzeRequestBody | null;
    const type = body?.type ?? 'listing';
    const samples = Array.isArray(body?.samples) ? body?.samples : [];

    if (!samples.length) {
      return NextResponse.json({ error: 'samples must contain at least one text item' }, { status: 400 });
    }

    const insights = samples.map((sample) => {
      const text = String(sample.text ?? '').toLowerCase();
      const matches = FLAGGED_KEYWORDS.filter((keyword) => text.includes(keyword));
      return {
        id: sample.id,
        flaggedKeywords: matches,
        riskLevel: matches.length >= 2 ? 'high' : matches.length === 1 ? 'medium' : 'low',
      };
    });

    return NextResponse.json({
      type,
      total: samples.length,
      insights,
    });
  } catch (error) {
    console.error('Admin content analysis POST error:', error);
    return NextResponse.json({ error: 'Failed to analyze content samples' }, { status: 500 });
  }
}
