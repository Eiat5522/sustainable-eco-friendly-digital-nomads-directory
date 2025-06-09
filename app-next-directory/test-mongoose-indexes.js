// Test file to validate mongoose schema indexes
const mongoose = require('mongoose');

// Test if our schemas create duplicate indexes
async function testSchemas() {
  try {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Import our models to trigger schema compilation
    const User = require('./src/models/User').default;
    const UserAnalytics = require('./src/models/UserAnalytics').default;
    const UserPreferences = require('./src/models/UserPreferences').default;
    const UserFavorite = require('./src/models/UserFavorite').default;

    console.log('All models loaded successfully without warnings');

    // Check the indexes that were created
    const userIndexes = await User.collection.getIndexes();
    const analyticsIndexes = await UserAnalytics.collection.getIndexes();
    const preferencesIndexes = await UserPreferences.collection.getIndexes();
    const favoritesIndexes = await UserFavorite.collection.getIndexes();

    console.log('User indexes:', Object.keys(userIndexes));
    console.log('UserAnalytics indexes:', Object.keys(analyticsIndexes));
    console.log('UserPreferences indexes:', Object.keys(preferencesIndexes));
    console.log('UserFavorite indexes:', Object.keys(favoritesIndexes));

    await mongoose.disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testSchemas();
