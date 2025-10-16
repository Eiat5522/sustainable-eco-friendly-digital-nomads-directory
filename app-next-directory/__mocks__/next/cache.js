// Mock for next/cache
const { jest } = require('@jest/globals');

const revalidatePath = jest.fn();
const revalidateTag = jest.fn();
const unstable_cache = jest.fn();
const unstable_noStore = jest.fn();

module.exports = {
  revalidatePath,
  revalidateTag,
  unstable_cache,
  unstable_noStore,
};
