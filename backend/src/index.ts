import { createServer } from 'node:http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSockets } from './sockets/index.js';

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = createServer(app);
  initSockets(server);

  server.listen(env.PORT, () => {
    console.log(`\n🚀  SupportFlow API listening on http://localhost:${env.PORT}`);
    console.log(`    Allowed client origin(s): ${env.CLIENT_URL}`);
    console.log(`    AI triage engine: ${env.AI_MODEL} (${env.AI_PROVIDER})\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start SupportFlow API:', err);
  process.exit(1);
});
