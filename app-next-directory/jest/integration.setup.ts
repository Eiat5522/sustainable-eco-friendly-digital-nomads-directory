import { beforeAll } from '@jest/globals';
import { createTestData, getTestUser } from '@/tests/helpers/test-data';

const ensureEnv = (key: string, value: string | undefined) => {
  if (!value || process.env[key]) return;
  process.env[key] = value;
};

beforeAll(() => {
  const dataset = createTestData();
  (global as any).__TEST_DATA__ = dataset;

  const defaultUser = getTestUser('user');
  ensureEnv('TEST_USER_EMAIL', defaultUser?.email);
  ensureEnv('TEST_USER_PASSWORD', defaultUser?.password);

  const venueOwner = getTestUser('venueOwner');
  ensureEnv('TEST_VENUE_OWNER_EMAIL', venueOwner?.email);
  ensureEnv('TEST_VENUE_OWNER_PASSWORD', venueOwner?.password);

  const adminUser = getTestUser('admin');
  ensureEnv('TEST_ADMIN_EMAIL', adminUser?.email);
  ensureEnv('TEST_ADMIN_PASSWORD', adminUser?.password);
});
