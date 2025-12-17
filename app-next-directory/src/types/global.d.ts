// Augment globalThis with mongoose cache for server-side usage
interface MongooseCache {
  conn: import('mongoose').Mongoose | null;
  promise: Promise<import('mongoose').Mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
  interface Global {
    mongoose: MongooseCache;
  }
}
