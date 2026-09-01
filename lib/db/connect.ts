import mongoose from "mongoose";
import "server-only";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __boutiquedeskMongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__boutiquedeskMongoose ?? {
  conn: null,
  promise: null,
};
global.__boutiquedeskMongoose = cached;

/**
 * Cached Mongoose connection for serverless environments — reuses the
 * connection across warm invocations instead of reconnecting every request.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.local.example)."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
