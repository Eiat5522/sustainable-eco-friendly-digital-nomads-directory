import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type {
  AdminSettings,
  AdminSettingsError,
  AdminSettingsResponse,
  AdminSettingsSaveRequest,
  AdminSettingsSaveResponse,
} from '@/types/admin-settings';
import { DEFAULT_ADMIN_SETTINGS } from '@/types/admin-settings';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

/**
 * GET /api/admin/settings
 * Retrieves the current admin settings from the database
 * Returns default settings if none exist
 */
export async function GET(request: NextRequest, _context: RouteContext) {
  try {
    // FORTEST: guard for prerender - handle headers() unavailability
    let session: Awaited<ReturnType<typeof auth>> | null = null;
    try {
      session = await auth(request?.headers);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('headers()') || msg.includes('During prerendering')) {
        structuredLogger.warn(
          '[api/admin/settings] headers() unavailable during prerender',
          error,
          {
            route: '/api/admin/settings',
          }
        );
        return new Response(null, { status: 204 });
      }
      throw error;
    }

    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json<AdminSettingsError>(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Query for admin settings document
    const query = `*[_type == "adminSettings"][0]`;

    let settings = await client.fetch<AdminSettings | null>(query);

    // If no settings exist, return defaults
    if (!settings) {
      settings = { ...DEFAULT_ADMIN_SETTINGS } as AdminSettings;
    }

    return NextResponse.json<AdminSettingsResponse>({ settings }, { status: 200 });
  } catch (error) {
    structuredLogger.error('Error fetching admin settings', error, {
      route: '/api/admin/settings',
      method: 'GET',
    });
    return NextResponse.json<AdminSettingsError>(
      {
        error: 'Failed to fetch admin settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Saves admin settings to the database
 * Creates a new document if none exists, or updates the existing one
 */
export async function POST(request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json<AdminSettingsError>(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as AdminSettingsSaveRequest;

    if (!body.settings) {
      return NextResponse.json<AdminSettingsError>(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Query for existing settings document
    const existingQuery = `*[_type == "adminSettings"][0]`;
    const existingSettings = await client.fetch<AdminSettings | null>(existingQuery);

    let savedSettings: AdminSettings;

    if (existingSettings?._id) {
      // Update existing settings
      savedSettings = (await client
        .patch(existingSettings._id)
        .set({
          ...body.settings,
          _type: 'adminSettings',
        })
        .commit()) as AdminSettings;
    } else {
      // Create new settings document
      const { _type: ignoredType, ...defaultSettings} = DEFAULT_ADMIN_SETTINGS;
      savedSettings = (await (client.create as (doc: unknown) => Promise<AdminSettings>)({
        _type: 'adminSettings',
        ...defaultSettings,
        ...body.settings,
      }));
    }

    return NextResponse.json<AdminSettingsSaveResponse>(
      {
        success: true,
        settings: savedSettings,
        message: 'Settings saved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    structuredLogger.error('Error saving admin settings', error, {
      route: '/api/admin/settings',
      method: 'POST',
    });
    return NextResponse.json<AdminSettingsError>(
      {
        error: 'Failed to save admin settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
