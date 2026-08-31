import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

/**
 * Vercel serverless entry point.
 *
 * Vercel does not run `src/index.ts` (there is no long-lived `server.listen`).
 * Instead every HTTP request is routed here (see `vercel.json` rewrites) and
 * handed to the same Express app used in local development.
 *
 * NOTE: Socket.IO is intentionally not initialised here — serverless functions
 * cannot hold persistent WebSocket connections. Real-time features require a
 * always-on host (Render / Railway / Fly.io).
 */
const app = createApp();

// Reuse a single DB connection across warm invocations.
let dbPromise: Promise<void> | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  dbPromise ??= connectDB();
  await dbPromise;
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
