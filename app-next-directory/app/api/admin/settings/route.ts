import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import { getSanityClient } from '@/lib/sanity/client'; // Changed import
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
export async function GET(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json<AdminSettingsError>(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Query for admin settings document
    const query = `*[_type == "adminSettings"][0]`;

    const sanityClient = getSanityClient(); // Get the lazily instantiated client
    let settings = await sanityClient.fetch<AdminSettings | null>(query); // Updated to use sanityClient.fetch

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
    const session = await auth();
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
    const sanityClient = getSanityClient(); // Get the lazily instantiated client
    const existingSettings = await sanityClient.fetch<AdminSettings | null>(existingQuery); // Updated to use sanityClient.fetch

    let savedSettings: AdminSettings;

    if (existingSettings?._id) {
      // Update existing settings
      savedSettings = (await sanityClient // Updated to use sanityClient.patch
        .patch(existingSettings._id)
        .set({
          ...body.settings,
          _type: 'adminSettings',
        })
        .commit()) as AdminSettings;
    } else {
      // Create new settings document
      const { _type: _ignoredType, ...defaultSettings } = DEFAULT_ADMIN_SETTINGS;
      savedSettings = await sanityClient.create<AdminSettings>({
        _type: 'adminSettings',
        ...defaultSettings,
        ...body.settings,
      });
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
