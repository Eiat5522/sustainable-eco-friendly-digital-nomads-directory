import path from 'node:path';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'next-sanity';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: 'v2023-06-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB.');

    console.log('Fetching users from Sanity...');
    const sanityUsers = await sanityClient.fetch('*[_type == "user"]');
    console.log(`Found ${sanityUsers.length} users in Sanity.`);

    for (const sanityUser of sanityUsers) {
      if (!sanityUser.email) {
        console.warn(`User ${sanityUser._id} has no email, skipping.`);
        continue;
      }

      const email = sanityUser.email.toLowerCase();
      const existingMongoUser = await User.findOne({ email });

      if (existingMongoUser) {
        console.log(`User ${email} already exists in MongoDB. Updating...`);
        await User.updateOne(
          { email },
          {
            $set: {
              name: sanityUser.name,
              image: sanityUser.avatar?.asset?._ref, // This might need mapping
              role: sanityUser.role || 'user',
              status: sanityUser.status || 'active',
            },
          }
        );
      } else {
        console.log(`Creating user ${email} in MongoDB...`);
        await User.create({
          name: sanityUser.name,
          email,
          role: sanityUser.role || 'user',
          status: sanityUser.status || 'active',
          // No password for migrated users (assume OAuth or they need to reset)
        });
      }
    }

    console.log('Migration completed.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
