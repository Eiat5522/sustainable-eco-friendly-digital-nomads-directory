import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'next-sanity';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import User from '../src/models/User.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: 'v2023-06-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function audit() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mongoUsers = await User.find({});
    const sanityUsers = await sanityClient.fetch('*[_type == "user"]');
    
    const mongoEmails = new Set(mongoUsers.map(u => u.email.toLowerCase()));
    const sanityEmails = new Set(sanityUsers.map(u => u.email.toLowerCase()));
    
    console.log('--- Audit Results ---');
    
    // 6.5 Verify every MongoDB user has corresponding Sanity doc
    const missingInSanity = mongoUsers.filter(u => !sanityEmails.has(u.email.toLowerCase()));
    console.log(`Users in MongoDB but missing in Sanity: ${missingInSanity.length}`);
    missingInSanity.forEach(u => console.log(` - ${u.email}`));
    
    // 6.6 Find orphaned Sanity user docs
    const missingInMongo = sanityUsers.filter(u => !mongoEmails.has(u.email.toLowerCase()));
    console.log(`Users in Sanity but missing in MongoDB: ${missingInMongo.length}`);
    missingInMongo.forEach(u => console.log(` - ${u.email}`));
    
    // Check role consistency
    const roleMismatches = [];
    for (const mUser of mongoUsers) {
      const sUser = sanityUsers.find(u => u.email.toLowerCase() === mUser.email.toLowerCase());
      if (sUser && sUser.role !== mUser.role) {
        roleMismatches.push({
          email: mUser.email,
          mongoRole: mUser.role,
          sanityRole: sUser.role
        });
      }
    }
    console.log(`Role mismatches: ${roleMismatches.length}`);
    roleMismatches.forEach(m => console.log(` - ${m.email}: Mongo(${m.mongoRole}) vs Sanity(${m.sanityRole})`));
    
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

audit();
