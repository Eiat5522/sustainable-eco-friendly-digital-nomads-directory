const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    console.log('Testing MongoDB connection with URI:', uri);

    const client = new MongoClient(uri);

    try {
        // Connect to MongoDB
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');

        // Test database operations
        const db = client.db('sustainable-nomads');
        const collections = await db.listCollections().toArray();
        console.log('📁 Available collections:', collections.map(c => c.name));

        // Test a simple operation
        const testCollection = db.collection('test');
        const result = await testCollection.insertOne({
            message: 'Connection test successful!',
            timestamp: new Date()
        });
        console.log('📝 Test document inserted with ID:', result.insertedId);

        // Clean up test document
        await testCollection.deleteOne({ _id: result.insertedId });
        console.log('🧹 Test document cleaned up');

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
    } finally {
        await client.close();
        console.log('🔒 Connection closed');
    }
}

testConnection();
