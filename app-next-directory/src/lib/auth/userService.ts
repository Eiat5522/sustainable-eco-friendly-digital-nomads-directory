// Sanity User Service - Manages user operations between NextAuth and Sanity
import { createClient } from "next-sanity";
import bcrypt from "bcryptjs";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: "v2023-06-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

/**
 * Find a user in Sanity by email
 */
export async function findSanityUserByEmail(email: string) {
  if (!email) return null;
  
  try {
    const query = `*[_type == "user" && email == $email][0]`;
    return await client.fetch(query, { email });
  } catch (err) {
    console.error("Error finding Sanity user by email:", err);
    return null;
  }
}

/**
 * Find a user in Sanity by ID
 */
export async function findSanityUserById(id: string) {
  if (!id) return null;
  
  try {
    return await client.fetch(`*[_type == "user" && _id == $id][0]`, { id });
  } catch (err) {
    console.error("Error finding Sanity user by ID:", err);
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
  bio = "", 
  role = "user" 
}: {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
}) {
  if (!email || !name) {
    throw new Error("Name and email are required to create a user");
  }

  // Check if user already exists
  const existingUser = await findSanityUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  try {
    const newUser = await client.create({
      _type: "user",
      name,
      email,
      bio,
      role,
      createdAt: new Date().toISOString(),
      ...(avatar && {
        avatar: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: avatar,
          },
        },
      }),
    });
    
    return newUser;
  } catch (err) {
    console.error("Error creating Sanity user:", err);
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
    const patch = client.patch(userId);
    
    if (updates.name) {
      patch.set({ name: updates.name });
    }
    
    if (updates.role) {
      patch.set({ role: updates.role });
    }
    
    if (updates.avatar) {
      patch.set({
        avatar: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: updates.avatar,
          },
        },
      });
    }
    
    return await patch.commit();
  } catch (err) {
    console.error("Error updating Sanity user:", err);
    return null;
  }
}

/**
 * Create a local credentials user with hashed password in MongoDB
 */
export async function createLocalUser(
  db: any,
  { name, email, password }: { name: string; email: string; password: string }
) {
  // Check if user exists
  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in MongoDB
  const result = await db.collection("users").insertOne({
    name,
    email,
    password: hashedPassword,
    role: "user",
    createdAt: new Date(),
  });

  // Create user in Sanity
  await createSanityUser({ name, email, role: "user" });

  return result;
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, newRole: string) {
  if (!userId || !newRole) return null;

  try {
    // Update in Sanity
    await client.patch(userId).set({ role: newRole }).commit();
    
    // If using MongoDB directly with the adapter, you'd need to update there too
    // This depends on your authentication setup
    
    return true;
  } catch (err) {
    console.error("Error updating user role:", err);
    return null;
  }
}
