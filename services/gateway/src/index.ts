import { createAndInitApp } from './app.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await createAndInitApp({ env, enableLogger: true });

const port = env.PORT;
const host = env.HOST;

try {
  await app.listen({ port, host });
  console.log(`Gateway listening on http://${host}:${port}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
