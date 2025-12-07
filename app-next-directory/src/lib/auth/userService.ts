// Sanity User Service - Manages user operations between NextAuth and Sanity

import bcrypt from 'bcryptjs';
import { createClient } from 'next-sanity';
import { structuredLogger } from '@/lib/logger';

// FORTEST: Lazy initialization to prevent module-scope errors during build
const disableSanity = process.env.DISABLE_SANITY_DURING_BUILD === '1' || process.env.DISABLE_SANITY_DURING_BUILD === 'true';

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  
  if (disableSanity) {
    // Return stub client when disabled
    return {
      fetch: async () => null,
      create: async (doc: any) => doc,
      patch: () => ({
        set: () => ({ commit: async () => ({}) }),
      }),
    } as unknown as ReturnType<typeof createClient>;
  }
  
  _client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: 'v2023-06-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });
  
  return _client;
}

/**
 * Find a user in Sanity by email
 */
export async function findSanityUserByEmail(email: string) {
  if (!email) return null;

  try {
    const query = `*[_type == "user" && email == $email][0]`;
    return await getClient().fetch(query, { email });
  } catch (err) {
    structuredLogger.error('Error finding Sanity user by email', err, {
      email: email, // Will be redacted by logger
      component: 'user-service',
      operation: 'find_by_email',
    });
    return null;
  }
}

/**
 * Find a user in Sanity by ID
 */
export async function findSanityUserById(id: string) {
  if (!id) return null;

  try {
    return await getClient().fetch(`*[_type == "user" && _id == $id][0]`, { id });
  } catch (err) {
    structuredLogger.error('Error finding Sanity user by ID', err, {
      userId: id,
      component: 'user-service',
      operation: 'find_by_id',
    });
    return null;
  }
}

/**
 * Create a new user in Sanity
 */
export async function createSanityUser({
  name,
  email,
  avatar,
  bio = '',
  role = 'user',
}: {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
}) {
  if (!email || !name) {
    throw new Error('Name and email are required to create a user');
  }

  // Check if user already exists
  const existingUser = await findSanityUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  try {
    const newUser = await getClient().create({
      _type: 'user',
      name,
      email,
      bio,
      role,
      createdAt: new Date().toISOString(),
      ...(avatar && {
        avatar: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: avatar,
          },
        },
      }),
    });

    return newUser;
  } catch (err) {
    structuredLogger.error('Error creating Sanity user', err, {
      email: email, // Will be redacted by logger
      component: 'user-service',
      operation: 'create_user',
    });
    throw err;
  }
}

/**
 * Update a Sanity user with authentication details
 */
export async function updateSanityUserWithAuthDetails(
  userId: string,
  updates: {
    name?: string;
    avatar?: string;
    role?: string;
  }
) {
  if (!userId) return null;

  try {
    const patch = getClient().patch(userId);

    if (updates.name) {
      patch.set({ name: updates.name });
    }

    if (updates.role) {
      patch.set({ role: updates.role });
    }

    if (updates.avatar) {
      patch.set({
        avatar: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: updates.avatar,
          },
        },
      });
    }

    return await patch.commit();
  } catch (err) {
    structuredLogger.error('Error updating Sanity user', err, {
      userId,
      component: 'user-service',
      operation: 'update_user',
    });
    return null;
  }
}

/**
 * Create a local credentials user with hashed password in MongoDB
 */
export async function createLocalUser(
  db: {
    collection: (name: string) => {
      findOne: (query: unknown) => Promise<unknown>;
      insertOne: (doc: unknown) => Promise<unknown>;
    };
  },
  { name, email, password }: { name: string; email: string; password: string }
) {
  // Normalize email for consistent lookups and writes
  const normalizedEmail = String(email).trim().toLowerCase();

  // Check if user exists (using normalized email)
  const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in MongoDB
  const result = await db.collection('users').insertOne({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
  });

  // Create user in Sanity
  await createSanityUser({ name, email: normalizedEmail, role: 'user' });

  return result;
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, newRole: string) {
  if (!userId || !newRole) return null;

  try {
    // Update in Sanity
    await getClient().patch(userId).set({ role: newRole }).commit();

    // If using MongoDB directly with the adapter, you'd need to update there too
    // This depends on your authentication setup

    return true;
  } catch (err) {
    structuredLogger.error('Error updating user role', err, {
      userId: userId,
      newRole: newRole,
      component: 'user-service',
      operation: 'update_role',
    });
    return null;
  }
}
