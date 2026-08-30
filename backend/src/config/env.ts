import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  AI_PROVIDER: z.enum(['local']).default('local'),
  AI_MODEL: z.string().default('supportflow-heuristic-v1'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌  Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  console.error('\n   Copy backend/.env.example to backend/.env and fill in the values.\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

/** Parsed list of allowed CORS / Socket.IO origins. */
export const clientOrigins = env.CLIENT_URL.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
