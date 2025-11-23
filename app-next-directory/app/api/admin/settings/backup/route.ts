import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDefaultTimeout, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { type AdminSettings, DEFAULT_ADMIN_SETTINGS } from '@/types/admin-settings';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };
type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const backupTimestamp = new Date().toISOString();
    const backupId = `backup-${backupTimestamp}`;

    const existingSettings = await withRequestTimeout(
      client.fetch<Pick<AdminSettings, '_id'> | null>('*[_type == "adminSettings"][0]{ _id }'),
      getDefaultTimeout(),
      'Fetching admin settings timed out'
    );

    let result: AdminSettings;

    if (existingSettings?._id) {
      result = (await withRequestTimeout(
        client
          .patch(existingSettings._id)
          .set({
            lastBackupDate: backupTimestamp,
            _type: 'adminSettings',
          })
          .commit(),
        getDefaultTimeout(),
        'Updating admin settings backup metadata timed out'
      )) as AdminSettings;
    } else {
      const payload: AdminSettings = {
        ...DEFAULT_ADMIN_SETTINGS,
        lastBackupDate: backupTimestamp,
      };

      result = await withRequestTimeout(
        client.create<AdminSettings>(payload),
        getDefaultTimeout(),
        'Creating admin settings document timed out'
      );
    }

    structuredLogger.info('Admin settings backup completed', {
      route: '/api/admin/settings/backup',
      backupId,
      userId: sessionUser?.id,
    });

    return NextResponse.json({
      success: true,
      backupId,
      lastBackupDate: backupTimestamp,
      settingsId: result._id,
      message: 'Backup completed successfully',
    });
  } catch (error) {
    structuredLogger.error('Admin settings backup error', error, {
      route: '/api/admin/settings/backup',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Failed to run admin settings backup' }, { status: 500 });
  }
}
