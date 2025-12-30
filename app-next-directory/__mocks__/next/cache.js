// Mock for next/cache
// Note: jest is available globally in Jest environment, no need to import

const revalidatePath = jest.fn();
const revalidateTag = jest.fn();
const unstable_cache = jest.fn(fn => fn);
const unstable_noStore = jest.fn();
const cacheLife = jest.fn();
const cacheTag = jest.fn();
const updateTag = jest.fn();

module.exports = {
  revalidatePath,
  revalidateTag,
  unstable_cache,
  unstable_noStore,
  cacheLife,
  cacheTag,
  updateTag,
};
