import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'next-sanity';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: 'v2023-06-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function sync() {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Fetching users from MongoDB...');
    const mongoUsers = await User.find({});
    console.log(`Found ${mongoUsers.length} users in MongoDB.`);

    for (const mongoUser of mongoUsers) {
      const email = mongoUser.email.toLowerCase();
      console.log(`Syncing user ${email}...`);

      const sanityUser = await sanityClient.fetch(
        '*[_type == "user" && email == $email][0]',
        { email }
      );

      if (sanityUser) {
        console.log(`Updating Sanity user ${email}...`);
        await sanityClient
          .patch(sanityUser._id)
          .set({
            role: mongoUser.role,
            status: mongoUser.status,
            name: mongoUser.name,
          })
          .commit();
      } else {
        console.log(`Creating Sanity user ${email}...`);
        await sanityClient.create({
          _type: 'user',
          email,
          name: mongoUser.name,
          role: mongoUser.role,
          status: mongoUser.status,
          createdAt: mongoUser.createdAt?.toISOString() || new Date().toISOString(),
        });
      }
    }

    console.log('Sync completed.');
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

sync();
