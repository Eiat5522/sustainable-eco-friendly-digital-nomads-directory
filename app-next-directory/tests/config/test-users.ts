import type { TestUser } from '@/tests/helpers/test-data';
import { getCredentialsForRole, TEST_USERS } from './test-data';

export type PlaywrightRole = 'customer' | 'venueOwner' | 'editor' | 'admin';

export interface PlaywrightTestUser {
  role: PlaywrightRole;
  email: string;
  password: string;
  name: string;
  sessionToken: string;
  description: string;
  storageStatePath?: string;
}

const ROLE_MAP: Record<PlaywrightRole, TestUser['role']> = {
  customer: 'user',
  venueOwner: 'venueOwner',
  editor: 'editor',
  admin: 'admin',
};

const DEFAULT_DESCRIPTIONS: Record<PlaywrightRole, string> = {
  customer: 'Standard explorer profile used for guest browsing flows.',
  venueOwner: 'Business owner with access to listing management tools.',
  editor: 'Content editor with publishing permissions.',
  admin: 'Administrator with elevated management privileges.',
};

const STORAGE_ROOT = 'tests/.auth';

export const TEST_USER_ACCOUNTS: Record<PlaywrightRole, PlaywrightTestUser> = (
  Object.keys(ROLE_MAP) as PlaywrightRole[]
).reduce(
  (acc, key) => {
    const credentials = getCredentialsForRole(ROLE_MAP[key]);
    if (!credentials) {
      throw new Error(`Missing credentials for ${key} role. Check test dataset.`);
    }

    acc[key] = {
      role: key,
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      sessionToken: credentials.sessionToken,
      description: DEFAULT_DESCRIPTIONS[key],
      storageStatePath: `${STORAGE_ROOT}/${key}.json`,
    };

    return acc;
  },
  {} as Record<PlaywrightRole, PlaywrightTestUser>
);

export const listTestUsers = (): PlaywrightTestUser[] => Object.values(TEST_USER_ACCOUNTS);

export const resolveTestUser = (role: PlaywrightRole = 'customer'): PlaywrightTestUser =>
  TEST_USER_ACCOUNTS[role];

export const RAW_TEST_USERS = TEST_USERS;
