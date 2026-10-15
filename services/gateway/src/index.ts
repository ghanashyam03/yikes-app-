import { buildApp } from './app.js';

const app = buildApp();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`Gateway listening on http://${host}:${port}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
