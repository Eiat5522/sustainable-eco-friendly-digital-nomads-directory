import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Bulk operation schemas
const BulkUpdateSchema = z.object({
  itemIds: z.array(z.string()),
  itemType: z.enum(['listing', 'review', 'blogPost', 'user', 'ecoTag', 'nomadFeature']),
  updates: z.record(z.any()),
  reason: z.string().optional()
});

const BulkDeleteSchema = z.object({
  itemIds: z.array(z.string()),
  itemType: z.enum(['listing', 'review', 'blogPost', 'user']),
  softDelete: z.boolean().default(true),
  reason: z.string().optional()
});

const BulkExportSchema = z.object({
  itemType: z.enum(['listing', 'review', 'blogPost', 'user', 'ecoTag', 'nomadFeature']),
  filters: z.record(z.any()).optional(),
  format: z.enum(['json', 'csv']).default('json'),
  fields: z.array(z.string()).optional()
});

const BulkImportSchema = z.object({
  itemType: z.enum(['listing', 'ecoTag', 'nomadFeature']),
  data: z.array(z.record(z.any())),
  updateExisting: z.boolean().default(false),
  validateOnly: z.boolean().default(false)
});

interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  results: any[];
  errors: any[];
}

async function performBulkUpdate(
  itemIds: string[],
  itemType: string,
  updates: Record<string, any>,
  operatorId: string,
  reason?: string
): Promise<BulkOperationResult> {
  const results: any[] = [];
  const errors: any[] = [];
  let processed = 0;

  for (const itemId of itemIds) {
    try {
      // Add operation metadata
      const updateData = {
        ...updates,
        _lastUpdatedBy: { _type: 'reference', _ref: operatorId },
        _lastUpdateReason: reason || 'Bulk update operation',
        _lastUpdateDate: new Date().toISOString()
      };

      await client.patch(itemId).set(updateData).commit();

      results.push({
        itemId,
        success: true,
        action: 'updated'
      });
      processed++;
    } catch (error) {
      errors.push({
        itemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    success: errors.length === 0,
    processed,
    failed: errors.length,
    results,
    errors
  };
}

async function performBulkDelete(
  itemIds: string[],
  itemType: string,
  softDelete: boolean,
  operatorId: string,
  reason?: string
): Promise<BulkOperationResult> {
  const results: any[] = [];
  const errors: any[] = [];
  let processed = 0;

  for (const itemId of itemIds) {
    try {
      if (softDelete) {
        // Soft delete
        await client.patch(itemId).set({
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: { _type: 'reference', _ref: operatorId },
          deletionReason: reason || 'Bulk delete operation'
        }).commit();
      } else {
        // Hard delete
        await client.delete(itemId);
      }

      results.push({
        itemId,
        success: true,
        action: softDelete ? 'soft_deleted' : 'hard_deleted'
      });
      processed++;
    } catch (error) {
      errors.push({
        itemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    success: errors.length === 0,
    processed,
    failed: errors.length,
    results,
    errors
  };
}

async function performBulkExport(
  itemType: string,
  filters: Record<string, any> = {},
  format: string = 'json',
  fields?: string[]
): Promise<any> {
  // Build GROQ query
  let filterQuery = '';
  if (Object.keys(filters).length > 0) {
    const filterConditions = Object.entries(filters).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key} match "${value}"`;
      } else if (Array.isArray(value)) {
        return `${key} in [${value.map(v => `"${v}"`).join(', ')}]`;
      } else {
        return `${key} == ${JSON.stringify(value)}`;
      }
    });
    filterQuery = ` && (${filterConditions.join(' && ')})`;
  }

  const fieldsProjection = fields?.length ?
    `{${fields.map(field => field === '_id' ? '_id' : `"${field}": ${field}`).join(', ')}}` :
    '';

  const query = `*[_type == "${itemType}"${filterQuery}]${fieldsProjection}`;

  const data = await client.fetch(query);

  if (format === 'csv') {
    // Convert to CSV format
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map((item: Record<string, any>) =>
      headers.map(header => {
        const value = item[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  return data;
}

async function performBulkImport(
  itemType: string,
  data: Record<string, any>[],
  updateExisting: boolean = false,
  validateOnly: boolean = false,
  operatorId: string
): Promise<BulkOperationResult> {
  const results: any[] = [];
  const errors: any[] = [];
  let processed = 0;

  for (const [index, item] of data.entries()) {
    try {
      // Add metadata
      const itemData = {
        _type: itemType,
        ...item,
        _createdBy: { _type: 'reference', _ref: operatorId },
        _createdAt: new Date().toISOString()
      };

      if (validateOnly) {
        // Just validate the data structure
        results.push({
          index,
          success: true,
          action: 'validated'
        });
        processed++;
        continue;
      }

      // Check if item exists (by slug or name)
      const existingQuery = item.slug?.current ?
        `*[_type == "${itemType}" && slug.current == "${item.slug.current}"][0]` :
        `*[_type == "${itemType}" && name == "${item.name}"][0]`;

      const existing = await client.fetch(existingQuery);

      if (existing && !updateExisting) {
        results.push({
          index,
          success: false,
          action: 'skipped',
          reason: 'Item already exists'
        });
        continue;
      }

      if (existing && updateExisting) {
        // Update existing item
        await client.patch(existing._id).set({
          ...itemData,
          _updatedAt: new Date().toISOString(),
          _updatedBy: { _type: 'reference', _ref: operatorId }
        }).commit();

        results.push({
          index,
          itemId: existing._id,
          success: true,
          action: 'updated'
        });
      } else {
        // Create new item
        const created = await client.create(itemData);

        results.push({
          index,
          itemId: created._id,
          success: true,
          action: 'created'
        });
      }

      processed++;
    } catch (error) {
      errors.push({
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: item
      });
    }
  }

  return {
    success: errors.length === 0,
    processed,
    failed: errors.length,
    results,
    errors
  };
}

// POST: Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    if (session.user.role !== 'admin') {
      return ApiResponseHandler.forbidden();
    }

    const body = await request.json();
    const { operation } = body;

    let result: BulkOperationResult | any;

    switch (operation) {
      case 'update': {
        const validatedData = BulkUpdateSchema.parse(body);
        result = await performBulkUpdate(
          validatedData.itemIds,
          validatedData.itemType,
          validatedData.updates,
          session.user.id,
          validatedData.reason
        );
        break;
      }

      case 'delete': {
        const validatedData = BulkDeleteSchema.parse(body);
        result = await performBulkDelete(
          validatedData.itemIds,
          validatedData.itemType,
          validatedData.softDelete,
          session.user.id,
          validatedData.reason
        );
        break;
      }

      case 'export': {
        const validatedData = BulkExportSchema.parse(body);
        const exportData = await performBulkExport(
          validatedData.itemType,
          validatedData.filters,
          validatedData.format,
          validatedData.fields
        );

        return ApiResponseHandler.success({
          data: exportData,
          format: validatedData.format,
          exportedAt: new Date().toISOString()
        });
      }

      case 'import': {
        const validatedData = BulkImportSchema.parse(body);
        result = await performBulkImport(
          validatedData.itemType,
          validatedData.data,
          validatedData.updateExisting,
          validatedData.validateOnly,
          session.user.id
        );
        break;
      }

      default:
        return ApiResponseHandler.error('Invalid operation type', 400);
    }

    return ApiResponseHandler.success(result, `Bulk ${operation} completed`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.error('Invalid request data', 400, error.errors);
    }

    console.error('Bulk operation error:', error);
    return ApiResponseHandler.error(
      error instanceof Error ? error.message : 'Failed to perform bulk operation',
      500
    );
  }
}

// GET: Get bulk operation templates and examples
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    if (session.user.role !== 'admin') {
      return ApiResponseHandler.forbidden();
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const itemType = searchParams.get('itemType');

    // Return templates and examples for bulk operations
    const templates = {
      update: {
        description: 'Update multiple items with the same fields',
        example: {
          operation: 'update',
          itemIds: ['id1', 'id2', 'id3'],
          itemType: 'listing',
          updates: {
            featured: true,
            sustainabilityScore: 4.5
          },
          reason: 'Promoting eco-friendly listings'
        }
      },
      delete: {
        description: 'Delete multiple items (soft delete by default)',
        example: {
          operation: 'delete',
          itemIds: ['id1', 'id2', 'id3'],
          itemType: 'review',
          softDelete: true,
          reason: 'Spam reviews cleanup'
        }
      },
      export: {
        description: 'Export data in JSON or CSV format',
        example: {
          operation: 'export',
          itemType: 'listing',
          format: 'csv',
          filters: {
            category: 'coworking',
            'city->name': 'Bangkok'
          },
          fields: ['name', 'category', 'sustainabilityScore']
        }
      },
      import: {
        description: 'Import data from JSON array',
        example: {
          operation: 'import',
          itemType: 'ecoTag',
          updateExisting: false,
          validateOnly: false,
          data: [
            {
              name: 'Solar Powered',
              slug: { _type: 'slug', current: 'solar-powered' },
              description: 'Uses solar energy'
            }
          ]
        }
      }
    };

    if (operation && templates[operation as keyof typeof templates]) {
      return ApiResponseHandler.success(templates[operation as keyof typeof templates]);
    }

    return ApiResponseHandler.success(templates, 'Bulk operation templates');
  } catch (error) {
    console.error('Bulk operations templates error:', error);
    return ApiResponseHandler.error('Failed to fetch templates', 500);
  }
}
