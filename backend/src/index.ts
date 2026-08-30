import { createServer } from 'node:http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initSockets } from './sockets';

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
