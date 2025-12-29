import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity';

export async function POST(request: Request) {
  let session = null;
  try {
    session = await auth(request?.headers);
  } catch (err) {
    structuredLogger.warn('[admin/listings/transfer] auth failed', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionUser = session?.user;
  if (!sessionUser?.id || !(sessionUser.role === 'admin' || sessionUser.role === 'superAdmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      listingId?: string;
      newOwnerId?: string;
      reason?: string;
    };
    const listingId = body?.listingId;
    const newOwnerId = body?.newOwnerId;

    if (!listingId || !newOwnerId) {
      return NextResponse.json({ error: 'listingId and newOwnerId are required' }, { status: 400 });
    }

    // fetch listing
    const listing = await client.fetch(
      `*[_type == "listing" && _id == $id][0]{_id, owner, ownerHistory}`,
      { id: listingId }
    );
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    // fetch target owner and compute effective limit
    const tierMap: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };
    const ownerDoc = await client.fetch(
      `*[_type == "user" && _id == $id][0]{_id, maxLocations, listingQuotaTier, quotaOverrideByAdmin}`,
      { id: newOwnerId }
    );
    if (!ownerDoc) return NextResponse.json({ error: 'Target owner not found' }, { status: 404 });

    const quotaOverride = !!ownerDoc?.quotaOverrideByAdmin;
    let effectiveLimit: number | null = null;
    if (ownerDoc?.maxLocations != null) effectiveLimit = Number(ownerDoc.maxLocations);
    else if (ownerDoc?.listingQuotaTier)
      effectiveLimit = tierMap[String(ownerDoc.listingQuotaTier)] ?? null;
    else effectiveLimit = tierMap.free;

    if (!quotaOverride && effectiveLimit != null) {
      const currentCount = await client.fetch(
        `count(*[_type == "listing" && owner._ref == $ownerRef])`,
        { ownerRef: newOwnerId }
      );
      if (Number(currentCount) >= Number(effectiveLimit)) {
        return NextResponse.json(
          {
            error: 'quota_exceeded',
            message: 'Target owner has reached their limit',
            currentCount,
            limit: effectiveLimit,
          },
          { status: 403 }
        );
      }
    }

    // perform patch: set owner first, then append history entry (do not rely on multi-doc transactions)
    const entry = {
      _key: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: listing.owner?._ref || null,
      to: newOwnerId,
      actor: sessionUser.id,
      reason: body?.reason || null,
      at: new Date().toISOString(),
    };

    structuredLogger.info('admin/listing-transfer: applying owner patch', {
      listingId,
      from: entry.from,
      to: entry.to,
      actor: entry.actor,
    });

    const setResult = await client
      .patch(listingId)
      .set({ owner: { _type: 'reference', _ref: newOwnerId } })
      .commit();

    try {
      await client.patch(listingId).append('ownerHistory', [entry]).commit();
    } catch (historyErr) {
      // Log and continue — history append is secondary; record for reconciliation
      structuredLogger.error('Failed to append ownerHistory after transfer', historyErr, {
        listingId,
        entry,
      });
    }

    structuredLogger.info('admin/listing-transfer: completed', {
      listingId,
      resultId: setResult?._id,
    });

    return NextResponse.json(setResult);
  } catch (error) {
    structuredLogger.error('Admin listing transfer failed', error, {
      component: 'admin-listings-transfer-api',
    });
    return NextResponse.json({ error: 'Failed to transfer listing' }, { status: 500 });
  }
}
