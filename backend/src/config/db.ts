import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

let started = false;

/**
 * Connects to MongoDB. On failure the server stays up (so the API can return a
 * clear 503 instead of the browser seeing an opaque "Network Error") and keeps
 * retrying in the background.
 */
export async function connectDB(): Promise<void> {
  if (started) return;
  started = true;

  const attempt = async (): Promise<void> => {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅  MongoDB connected (db: ${conn.connection.name})`);
    } catch (err) {
      console.error('\n❌  Could not connect to MongoDB.');
      console.error(`    ${(err as Error).message}`);
      console.error('    The API is running but database routes will return 503.');
      console.error('    Fix MONGODB_URI in backend/.env, then it will reconnect automatically.\n');
      setTimeout(() => {
        void attempt();
      }, 5000);
    }
  };

  await attempt();
}

export function dbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', (err as Error).message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected');
});
mongoose.connection.on('connected', () => {
  console.log('✅  MongoDB connection is live');
});
