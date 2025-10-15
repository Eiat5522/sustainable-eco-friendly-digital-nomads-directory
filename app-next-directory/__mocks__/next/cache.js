// Mock for next/cache
module.exports = {
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn(),
  unstable_noStore: jest.fn(),
};
