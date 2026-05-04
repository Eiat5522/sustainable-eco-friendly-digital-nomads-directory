const mockClient = {
  patch: () => ({
    set: () => ({
      commit: async () => new Promise(resolve => setTimeout(resolve, 50))
    })
  }),
  delete: async () => new Promise(resolve => setTimeout(resolve, 50))
};

async function performBulkDeleteSequential() {
  console.time('Sequential Implementation (baseline)');
  const itemIds = Array.from({length: 20}, (_, i) => `id-${i}`);
  const results = [];
  const errors = [];
  let processed = 0;

  for (const itemId of itemIds) {
    try {
      await mockClient.delete(itemId);
      results.push({ itemId, success: true });
      processed++;
    } catch (error) {
      errors.push({ itemId, error });
    }
  }
  console.timeEnd('Sequential Implementation (baseline)');
  return { success: true, processed, failed: 0, results, errors };
}

async function performBulkDeleteParallel() {
  console.time('Parallel Implementation (current)');
  const itemIds = Array.from({length: 20}, (_, i) => `id-${i}`);
  const results = [];
  const errors = [];
  let processed = 0;

  const deletePromises = itemIds.map(async (itemId) => {
    await mockClient.delete(itemId);
    return itemId;
  });

  const settledPromises = await Promise.allSettled(deletePromises);

  settledPromises.forEach((result, index) => {
    const itemId = itemIds[index];
    if (result.status === 'fulfilled') {
      results.push({ itemId, success: true });
      processed++;
    } else {
      errors.push({ itemId, error: result.reason });
    }
  });

  console.timeEnd('Parallel Implementation (current)');
  return { success: true, processed, failed: 0, results, errors };
}

async function run() {
  await performBulkDeleteSequential();
  await performBulkDeleteParallel();
}

run();
