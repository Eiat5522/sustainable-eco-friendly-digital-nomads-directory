import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

let envLoaded = false;

function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) return;
  dotenv.config({ path: envPath });
}

/**
 * Load local environment files for the standalone MCP server.
 *
 * `.env.local` takes precedence over `.env`, mirroring the common Next.js
 * development pattern while keeping production behavior unchanged.
 */
export function loadMcpServerEnv(): void {
  if (envLoaded) return;

  const cwd = process.cwd();
  loadEnvFile(resolve(cwd, '.env.local'));
  loadEnvFile(resolve(cwd, '.env'));

  envLoaded = true;
}

loadMcpServerEnv();
