import type { FastifyInstance } from 'fastify';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function loadRoutes(app: FastifyInstance, routesDir?: string): Promise<string[]> {
  const currentDir = routesDir ?? dirname(fileURLToPath(import.meta.url));
  const files = readdirSync(currentDir);
  const loadedRoutes: string[] = [];

  for (const file of files) {
    if (
      (file.endsWith('.ts') || file.endsWith('.js')) &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.js') &&
      !file.endsWith('.d.ts') &&
      file !== 'loader.ts' &&
      file !== 'loader.js'
    ) {
      const fullPath = join(currentDir, file);
      const fileUrl = pathToFileURL(fullPath).href;
      const mod = await import(fileUrl);

      if (typeof mod.register === 'function') {
        await mod.register(app);
        loadedRoutes.push(file);
      }
    }
  }

  return loadedRoutes;
}
