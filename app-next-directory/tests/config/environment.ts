import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

const envFilePath = process.env.PLAYWRIGHT_DOTENV_PATH ?? resolve(process.cwd(), '.env.test');
const localEnvFilePath = resolve(process.cwd(), '.env.local');

if (existsSync(localEnvFilePath)) {
  loadEnv({ path: localEnvFilePath, override: false });
}

if (!process.env.SKIP_PLAYWRIGHT_DOTENV && existsSync(envFilePath)) {
  loadEnv({ path: envFilePath, override: true });
}

const rawBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

const normaliseURL = (value: string) => {
  try {
    return new URL(value);
  } catch (error) {
    throw new Error(`Invalid Playwright base URL: ${value}`);
  }
};

const resolvedURL = normaliseURL(rawBaseURL);

const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const serverWaitURL = normaliseURL(rawBaseURL);
if (serverWaitURL.hostname === '0.0.0.0' || serverWaitURL.hostname === '::1') {
  serverWaitURL.hostname = '127.0.0.1';
}

export const PLAYWRIGHT_BASE_URL = resolvedURL.toString().replace(/\/$/, '');
export const PLAYWRIGHT_SERVER_WAIT_URL = serverWaitURL;
export const PLAYWRIGHT_IS_LOCAL = localHosts.has(resolvedURL.hostname);
export const PLAYWRIGHT_PORT = Number(resolvedURL.port || 3000);

export const PLAYWRIGHT_ENV = {
  baseURL: PLAYWRIGHT_BASE_URL,
  isLocal: PLAYWRIGHT_IS_LOCAL,
  port: PLAYWRIGHT_PORT,
  serverWaitURL: PLAYWRIGHT_SERVER_WAIT_URL,
};
