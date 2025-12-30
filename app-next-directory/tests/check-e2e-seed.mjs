import { MongoClient } from 'mongodb';

(async function main() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/e2e_test';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const usersCount = await db.collection('users').countDocuments();
    const citiesCount = await db.collection('cities').countDocuments();

    console.log(`Seed check: users=${usersCount}, cities=${citiesCount}`);

    if (usersCount === 0 && citiesCount === 0) {
      console.error('Seed check failed: expected seeded data but collections are empty');
      await client.close();
      process.exit(2);
    }

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed check error:', err);
    process.exit(3);
  }
})();
