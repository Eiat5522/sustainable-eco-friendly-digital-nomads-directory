const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app-next-directory/src/app/api/admin/bulk-operations/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const originalCode = `async function performBulkDelete(
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
}`;

const newCode = `async function performBulkDelete(
  itemIds: string[],
  itemType: string,
  softDelete: boolean,
  operatorId: string,
  reason?: string
): Promise<BulkOperationResult> {
  const results: any[] = [];
  const errors: any[] = [];
  let processed = 0;

  const deletePromises = itemIds.map(async (itemId) => {
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
    return itemId;
  });

  const settledPromises = await Promise.allSettled(deletePromises);

  settledPromises.forEach((result, index) => {
    const itemId = itemIds[index];
    if (result.status === 'fulfilled') {
      results.push({
        itemId,
        success: true,
        action: softDelete ? 'soft_deleted' : 'hard_deleted'
      });
      processed++;
    } else {
      errors.push({
        itemId,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
      });
    }
  });

  return {
    success: errors.length === 0,
    processed,
    failed: errors.length,
    results,
    errors
  };
}`;

if (content.includes(originalCode)) {
  content = content.replace(originalCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated performBulkDelete');
} else {
  console.log('Could not find original code to replace');
}
