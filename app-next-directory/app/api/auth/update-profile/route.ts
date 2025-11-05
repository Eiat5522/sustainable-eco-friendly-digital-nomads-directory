import { NextResponse, type NextRequest } from 'next/server';

import type { UpdateUserProfileInput } from '@/lib/auth/serverAuth';

const MAX_NAME_LENGTH = 120;

const json = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    headers: { 'Cache-Control': 'no-store' },
    ...init,
  });

const serviceUnavailable = () =>
  json(
    {
      success: false,
      data: null,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Profile updates are currently disabled.',
      },
    },
    { status: 503, headers: { 'Retry-After': '60' } }
  );

interface UserRecord {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

const sanitizeUser = (user: unknown) => {
  if (!user || typeof user !== 'object') return null;
  const u = user as Partial<UserRecord>;
  return {
    id: u.id ?? '',
    name: u.name ?? null,
    email: u.email ?? null,
    image: u.image ?? null,
    role: u.role,
  };
};

async function ensureAuthenticated() {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: json(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
          },
        },
        { status: 401 }
      ),
    } as const;
  }

  return { userId: session.user.id } as const;
}

async function parsePayload(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return {
        error: json(
          {
            success: false,
            data: null,
            error: {
              code: 'INVALID_INPUT',
              message: 'Request body must be a JSON object.',
            },
          },
          { status: 400 }
        ),
      } as const;
    }

    return { body } as const;
  } catch {
    return {
      error: json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_JSON',
            message: 'Unable to parse request body.',
          },
        },
        { status: 400 }
      ),
    } as const;
  }
}

function validatePayload(raw: Record<string, unknown>) {
  const errors: string[] = [];
  const update: UpdateUserProfileInput = {};

  if ('name' in raw) {
    if (typeof raw.name !== 'string') {
      errors.push('Name must be a string.');
    } else {
      const trimmed = raw.name.trim();
      if (trimmed.length === 0) {
        errors.push('Name cannot be empty.');
      } else if (trimmed.length > MAX_NAME_LENGTH) {
        errors.push(`Name cannot exceed ${MAX_NAME_LENGTH} characters.`);
      } else {
        update.name = trimmed;
      }
    }
  }

  if ('image' in raw) {
    const value = raw.image;
    if (value === null) {
      update.image = null;
    } else if (typeof value === 'string') {
      update.image = value.trim();
    } else {
      errors.push('Image must be a string URL or null.');
    }
  }

  if (!('name' in raw) && !('image' in raw)) {
    errors.push('At least one of name or image must be provided.');
  }

  if (errors.length > 0) {
    return {
      error: json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_INPUT',
            message: errors.join(' '),
          },
        },
        { status: 400 }
      ),
    } as const;
  }

  return { update } as const;
}

async function handleProfileMutation(request: NextRequest): Promise<NextResponse> {
  if (!process.env.MONGODB_URI) {
    return serviceUnavailable();
  }

  const authResult = await ensureAuthenticated();
  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  const payloadResult = await parsePayload(request);
  if ('error' in payloadResult && payloadResult.error) {
    return payloadResult.error;
  }

  const validationResult = validatePayload(payloadResult.body as Record<string, unknown>);
  if ('error' in validationResult && validationResult.error) {
    return validationResult.error;
  }

  try {
    const { updateUserProfile } = await import('@/lib/auth/serverAuth');
    const updatedUser = await updateUserProfile(authResult.userId, validationResult.update);
    const sanitizedUser = sanitizeUser(updatedUser);

    if (!sanitizedUser) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found or update failed.',
          },
        },
        { status: 404 }
      );
    }

    return json({
      success: true,
      data: {
        user: sanitizedUser,
      },
      error: null,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return json(
      {
        success: false,
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update profile.',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return handleProfileMutation(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleProfileMutation(request);
}

export async function GET() {
  return json(
    {
      success: false,
      data: null,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use PATCH to update the profile.',
      },
    },
    { status: 405 }
  );
}
