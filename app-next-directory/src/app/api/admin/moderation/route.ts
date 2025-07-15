import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { z } from 'zod';

// Moderation action schema
const ModerationActionSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['listing', 'review', 'blogPost', 'user']),
  action: z.enum(['approve', 'reject', 'flag', 'unflag', 'suspend', 'unsuspend', 'delete']),
  reason: z.string().optional(),
  notes: z.string().optional()
});

const BulkModerationSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    itemType: z.enum(['listing', 'review', 'blogPost', 'user'])
  })),
  action: z.enum(['approve', 'reject', 'flag', 'unflag', 'suspend', 'unsuspend', 'delete']),
  reason: z.string().optional(),
  notes: z.string().optional()
});

interface ModerationItem {
  _id: string;
  _type: string;
  name?: string;
  title?: string;
  content?: string;
  status: string;
  flagReason?: string;
  _createdAt: string;
  _updatedAt: string;
  author?: {
    name: string;
    email: string;
  };
  reportCount?: number;
  lastModerated?: string;
  moderatedBy?: string;
}

async function getModerationQueue(filters: any = {}): Promise<ModerationItem[]> {
  const { status = 'pending', type, limit = 50, offset = 0 } = filters;

  const typeFilter = type ? `&& _type == "${type}"` : '';
  const statusFilter = status !== 'all' ? `&& (moderationStatus.status == "${status}" || !defined(moderationStatus))` : '';

  const query = `
    *[_type in ["listing", "review", "blogPost", "user"] ${typeFilter} ${statusFilter}] | order(_createdAt desc) [${offset}...${offset + limit}] {
      _id,
      _type,
      _createdAt,
      _updatedAt,
      "name": coalesce(name, title, email),
      "content": coalesce(content, comment, excerpt, description)[0...200],
      "status": coalesce(moderationStatus.status, "pending"),
      "flagReason": moderationStatus.reason,
      "reportCount": count(*[_type == "report" && references(^._id)]),
      "lastModerated": moderationStatus.moderatedAt,
      "moderatedBy": moderationStatus.moderatedBy->name,
      "author": select(
        _type == "review" => author->{name, email},
        _type == "listing" => {
          "name": coalesce(contactInfo.name, "Anonymous"),
          "email": contactInfo.email
        },
        _type == "blogPost" => author->{name, email},
        _type == "user" => {name, email}
      )
    }
  `;

  return client.fetch(query);
}

async function performModerationAction(
  itemId: string,
  itemType: string,
  action: string,
  moderatorId: string,
  reason?: string,
  notes?: string
) {
  const moderationData = {
    status: action,
    moderatedAt: new Date().toISOString(),
    moderatedBy: { _type: 'reference', _ref: moderatorId },
    reason: reason ?? '',
    notes: notes ?? '',
    history: {
      _type: 'array',
      action,
      timestamp: new Date().toISOString(),
      moderator: { _type: 'reference', _ref: moderatorId },
      reason: reason ?? '',
      notes: notes ?? ''
    }
  };

  // Update the item with moderation status
  const updateQuery = `*[_id == $itemId][0]`;
  const existingItem = await client.fetch(updateQuery, { itemId });

  if (!existingItem) {
    throw new Error('Item not found');
  }

  // Handle different actions
  switch (action) {
    case 'approve':
      await client.patch(itemId).set({
        moderationStatus: { ...moderationData, status: 'approved' }
      }).commit();
      break;

    case 'reject':
      await client.patch(itemId).set({
        moderationStatus: { ...moderationData, status: 'rejected' }
      }).commit();
      break;

    case 'flag':
      await client.patch(itemId).set({
        moderationStatus: { ...moderationData, status: 'flagged' }
      }).commit();
      break;

    case 'unflag':
      await client.patch(itemId).set({
        moderationStatus: { ...moderationData, status: 'approved' }
      }).commit();
      break;

    case 'suspend':
      if (itemType === 'user') {
        await client.patch(itemId).set({
          status: 'suspended',
          moderationStatus: { ...moderationData, status: 'suspended' }
        }).commit();
      }
      break;

    case 'unsuspend':
      if (itemType === 'user') {
        await client.patch(itemId).set({
          status: 'active',
          moderationStatus: { ...moderationData, status: 'approved' }
        }).commit();
      }
      break;

    case 'delete':
      // Soft delete by setting status
      await client.patch(itemId).set({
        deleted: true,
        deletedAt: new Date().toISOString(),
        moderationStatus: { ...moderationData, status: 'deleted' }
      }).commit();
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  return { success: true, action, itemId };
}

// GET: Fetch moderation queue
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    // Check if user is admin or moderator
    if (!['admin', 'moderator'].includes(session.user.role)) {
      return ApiResponseHandler.forbidden();
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || 'pending',
      type: searchParams.get('type'),
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const moderationQueue = await getModerationQueue(filters);

    // Get summary statistics
    const stats = await client.fetch(`
      {
        "pending": count(*[_type in ["listing", "review", "blogPost", "user"] && (moderationStatus.status == "pending" || !defined(moderationStatus))]),
        "flagged": count(*[_type in ["listing", "review", "blogPost", "user"] && moderationStatus.status == "flagged"]),
        "approved": count(*[_type in ["listing", "review", "blogPost", "user"] && moderationStatus.status == "approved"]),
        "rejected": count(*[_type in ["listing", "review", "blogPost", "user"] && moderationStatus.status == "rejected"]),
        "total": count(*[_type in ["listing", "review", "blogPost", "user"]])
      }
    `);

    return ApiResponseHandler.success({
      items: moderationQueue,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: moderationQueue.length === filters.limit
      }
    });
  } catch (error) {
    console.error('Moderation queue error:', error);
    return ApiResponseHandler.error('Failed to fetch moderation queue', 500);
  }
}

// POST: Perform moderation action
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    if (!['admin', 'moderator'].includes(session.user.role)) {
      return ApiResponseHandler.forbidden();
    }

    const body = await request.json();

    // Check if it's a bulk operation
    if (body.items && Array.isArray(body.items)) {
      const validatedData = BulkModerationSchema.parse(body);
      const results = [];

      for (const item of validatedData.items) {
        try {
          const result = await performModerationAction(
            item.itemId,
            item.itemType,
            validatedData.action,
            session.user.id,
            validatedData.reason ?? '',
            validatedData.notes ?? ''
          );
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            itemId: item.itemId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return ApiResponseHandler.success(results, 'Bulk moderation completed');
    } else {
      // Single item moderation
      const validatedData = ModerationActionSchema.parse(body);

      const result = await performModerationAction(
        validatedData.itemId,
        validatedData.itemType,
        validatedData.action,
        session.user.id,
        validatedData.reason ?? '',
        validatedData.notes ?? ''
      );

      return ApiResponseHandler.success(result, 'Moderation action completed');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.error('Invalid request data', 400, error.errors);
    }

    console.error('Moderation action error:', error);
    return ApiResponseHandler.error(
      error instanceof Error ? error.message : 'Failed to perform moderation action',
      500
    );
  }
}
