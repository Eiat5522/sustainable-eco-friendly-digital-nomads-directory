import { type NextRequest, NextResponse } from 'next/server';
import {
  fetchModerationQueue,
  type ModerationAction,
  performModerationAction,
  summarizeModerationQueue,
} from '@/lib/admin/analytics';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(sessionUser: SessionUser) {
  const role = sessionUser?.role;
  if (role === 'admin' || role === 'superAdmin') {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest, _context: RouteContext) {
  try {
    // FORTEST: guard for prerender - catch auth failures during prerender
    let session;
    try {
      session = await auth();
    } catch (authError) {
      structuredLogger.warn('[api/admin/moderation] auth() unavailable during prerender', authError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable during build' },
        { status: 503 }
      );
    }
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = Number(limitParam ?? 10);
    const withSummary = url.searchParams.get('summary') === 'true';

    const itemsPromise = fetchModerationQueue(Number.isFinite(limit) && limit > 0 ? limit : 10);
    const summaryPromise = withSummary ? summarizeModerationQueue() : null;

    const [items, summary] = await Promise.all([itemsPromise, summaryPromise]);

    return NextResponse.json({ items, ...(summary ? { summary } : {}) });
  } catch (error) {
    structuredLogger.error('Admin moderation GET error', error, {
      route: '/api/admin/moderation',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to load moderation queue' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, _context: RouteContext) {
  try {
    // FORTEST: guard for prerender - catch auth failures during prerender
    let session;
    try {
      session = await auth();
    } catch (authError) {
      structuredLogger.warn('[api/admin/moderation] auth() unavailable during prerender', authError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable during build' },
        { status: 503 }
      );
    }
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const moderationId = body?.moderationId;
    const action: ModerationAction | undefined = body?.action;
    const notes: string | undefined = body?.notes;

    if (!moderationId || typeof moderationId !== 'string') {
      return NextResponse.json({ error: 'moderationId is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    if (!['approve', 'restrict', 'dismiss', 'flag', 'saveNote'].includes(action)) {
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    const actor = sessionUser?.id ?? 'system';

    const result = await performModerationAction({ moderationId, action, notes, actorId: actor });

    return NextResponse.json({
      message: `Action "${action}" applied`,
      moderation: result,
    });
  } catch (error) {
    structuredLogger.error('Admin moderation POST error', error, {
      route: '/api/admin/moderation',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Failed to process moderation action' }, { status: 500 });
  }
}
