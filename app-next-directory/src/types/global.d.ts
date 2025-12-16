

declare global {
  interface Window {
    // Speech recognition APIs removed - feature not implemented
  }

  // Augment globalThis with mongoose cache for server-side usage
  interface MongooseCache {
    conn: import('mongoose').Mongoose | null;
    promise: Promise<import('mongoose').Mongoose> | null;
  }

  var mongoose: MongooseCache;
  interface Global {
    mongoose: MongooseCache;
  }

  // SpeechRecognition interface removed - feature not implemented
}
