import type { CorsOptions } from 'cors';
import { clientOrigins, isDev } from './env.js';

/**
 * CORS policy.
 *
 * - In **development** any origin is reflected back (localhost, 127.0.0.1, a LAN
 *   IP such as http://10.x.x.x:3000, an alternate port, etc.) so the app works
 *   no matter which URL the browser used.
 * - In **production** only the origins listed in CLIENT_URL are allowed.
 */
export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    // Non-browser clients (curl, server-to-server) send no Origin header.
    if (!origin) return callback(null, true);
    if (isDev) return callback(null, true);
    if (clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
};

/** Origin check shared with Socket.IO. */
export function socketCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (isDev) return true;
  return clientOrigins.includes(origin);
}
