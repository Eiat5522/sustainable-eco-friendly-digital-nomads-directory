/** biome-ignore-all lint/suspicious/noConsole: false positive */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { type Page, test as setup } from '@playwright/test';
import type { Role } from '@/models/User';
import { loginAs } from './utils/test-utils';

setup.setTimeout(120000);

const storageDir = path.resolve(process.cwd(), 'tests', 'storageStates');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const authFile = path.join(storageDir, 'user.json');
const adminAuthFile = path.join(storageDir, 'admin.json');
const venueOwnerAuthFile = path.join(storageDir, 'venueOwner.json');
const superAdminAuthFile = path.join(storageDir, 'superAdmin.json');

type AuthConfig = {
  emailEnvVar: string;
  passwordEnvVar: string;
  defaultEmail: string;
  defaultPassword: string;
  outputPath: string;
  expectedPaths: string[];
  role?: Role;
};

type DebugArtifacts = { png?: string; html?: string; logsPath?: string };
type DebugDumper = (suffix?: string) => Promise<DebugArtifacts>;
type PrimaryAuthResult = { success: boolean; error: unknown; artifacts: DebugArtifacts | null };

function buildArtifactParts(artifacts: DebugArtifacts | null): string[] {
  const parts: string[] = [];
  if (artifacts?.png) parts.push(`screenshot=${artifacts.png}`);
  if (artifacts?.html) parts.push(`html=${artifacts.html}`);
  if (artifacts?.logsPath) parts.push(`logs=${artifacts.logsPath}`);
  return parts;
}

function createDebugDumper(page: Page, debugBase: string, consoleMessages: string[]): DebugDumper {
  return async (suffix = 'error') => {
    try {
      const base = `${debugBase}-${suffix}-${Date.now()}`;
      const png = `${base}.png`;
      const html = `${base}.html`;
      const logsPath = `${base}.log`;

      await page.screenshot({ path: png, fullPage: true });
      fs.writeFileSync(html, await page.content());
      if (consoleMessages.length) {
        fs.writeFileSync(logsPath, consoleMessages.join('\n'));
      }

      const result: DebugArtifacts = { png, html };
      if (consoleMessages.length) {
        result.logsPath = logsPath;
      }
      return result;
    } catch (e) {
      // best-effort: log but don't mask original error
      console.error('Failed to write debug artifacts:', e);
      return {};
    }
  };
}

function resolveCredentials(config: AuthConfig): { email: string; password: string } {
  const email = process.env[config.emailEnvVar] || config.defaultEmail;
  const password = process.env[config.passwordEnvVar] || config.defaultPassword;

  if (!email || !password) {
    throw new Error(
      `Missing credentials for env vars ${config.emailEnvVar}/${config.passwordEnvVar}. Email present: ${Boolean(email)}, Password present: ${Boolean(password)}`
    );
  }

  return { email, password };
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createEmailHash(email: string): string {
  return createHash('sha256').update(email).digest('hex');
}

function buildAuthFailureMessage(options: {
  emailEnvVar: string;
  email: string;
  authError: unknown;
  artifacts: DebugArtifacts | null;
  consoleMessages: string[];
  currentUrl: string;
  fallbackError?: unknown;
}): string {
  const emailHash = createEmailHash(options.email);
  const artifactParts = buildArtifactParts(options.artifacts);
  const baseErrorLabel = options.fallbackError ? 'UI error' : 'Error';
  const fallbackMessage = options.fallbackError
    ? ` Fallback error: ${formatError(options.fallbackError)}.`
    : '';

  return `Authentication failed for env ${options.emailEnvVar} (email hash: ${emailHash}). ${baseErrorLabel}: ${formatError(options.authError)}.${fallbackMessage} Current URL: ${options.currentUrl}. Artifacts: ${artifactParts.join('; ')}. Console:\n${options.consoleMessages.join('\n')}`;
}

async function tryPrimaryAuthentication(options: {
  page: Page;
  email: string;
  password: string;
  expectedPaths: string[];
  dumpDebug: DebugDumper;
}): Promise<PrimaryAuthResult> {
  const { page, email, password, expectedPaths, dumpDebug } = options;
  try {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="email"]').first().fill(email);
    await page.locator('input[name="password"]').first().fill(password);
    await page.click('button[type="submit"]', { noWaitAfter: true });

    await page.waitForURL(
      (url: URL) =>
        expectedPaths.some(p =>
          p === '/' ? url.pathname === '/' : url.pathname === p || url.pathname.startsWith(p + '/')
        ),
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    );
    return { success: true, error: null, artifacts: null };
  } catch (error) {
    const artifacts = await dumpDebug('auth-failure');
    return { success: false, error, artifacts };
  }
}

async function attemptFallbackLogin(options: {
  page: Page;
  role: Role;
  expectedPath: string;
  authError: unknown;
  artifacts: DebugArtifacts | null;
  consoleMessages: string[];
  email: string;
  emailEnvVar: string;
}): Promise<boolean> {
  const { page, role, expectedPath, authError, artifacts, consoleMessages, email, emailEnvVar } =
    options;
  try {
    await loginAs(page, role, { redirectTo: expectedPath });
    return true;
  } catch (fallbackError) {
    throw new Error(
      buildAuthFailureMessage({
        emailEnvVar,
        email,
        authError,
        fallbackError,
        artifacts,
        consoleMessages,
        currentUrl: page.url(),
      })
    );
  }
}

async function saveStorageState(options: {
  page: Page;
  outputPath: string;
  dumpDebug: DebugDumper;
  consoleMessages: string[];
}): Promise<void> {
  const { page, outputPath, dumpDebug, consoleMessages } = options;
  try {
    await page.context().storageState({ path: outputPath });
  } catch (error) {
    const storageStateArtifacts = await dumpDebug('storageState-failure');
    const artifactParts = buildArtifactParts(storageStateArtifacts);
    throw new Error(
      `Failed to write storage state to ${outputPath}: ${formatError(error)}. Artifacts: ${artifactParts.join('; ')}. Console:\n${consoleMessages.join('\n')}`
    );
  }
}

async function authenticateUser(page: Page, config: AuthConfig) {
  const { emailEnvVar, outputPath, expectedPaths, role } = config;

  // Collect console messages and page errors for richer debugging
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => consoleMessages.push(`pageerror: ${err.message}`));

  const { email, password } = resolveCredentials(config);
  const debugBase = path.join(storageDir, path.basename(outputPath, path.extname(outputPath)));
  const dumpDebug = createDebugDumper(page, debugBase, consoleMessages);

  const primaryResult = await tryPrimaryAuthentication({
    page,
    email,
    password,
    expectedPaths,
    dumpDebug,
  });

  let hasAuthenticated = primaryResult.success;

  if (!hasAuthenticated && role) {
    hasAuthenticated = await attemptFallbackLogin({
      page,
      role,
      expectedPath: expectedPaths[0] ?? '/',
      authError: primaryResult.error,
      artifacts: primaryResult.artifacts,
      consoleMessages,
      email,
      emailEnvVar,
    });
  }

  if (!hasAuthenticated) {
    throw new Error(
      buildAuthFailureMessage({
        emailEnvVar,
        email,
        authError: primaryResult.error,
        artifacts: primaryResult.artifacts,
        consoleMessages,
        currentUrl: page.url(),
      })
    );
  }

  await saveStorageState({ page, outputPath, dumpDebug, consoleMessages });
}

// Authenticate regular user
setup('authenticate user', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_USER_EMAIL',
    passwordEnvVar: 'E2E_USER_PASSWORD',
    defaultEmail: 'e2e-test@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: authFile,
    expectedPaths: ['/dashboard', '/'],
    role: 'user',
  });
});

// Authenticate admin user
setup('authenticate admin', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_ADMIN_EMAIL',
    passwordEnvVar: 'E2E_ADMIN_PASSWORD',
    defaultEmail: 'admin@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: adminAuthFile,
    expectedPaths: ['/admin', '/dashboard', '/'],
    role: 'admin',
  });
});

// Authenticate venue owner user
setup('authenticate venue owner', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_VENUE_OWNER_EMAIL',
    passwordEnvVar: 'E2E_VENUE_OWNER_PASSWORD',
    defaultEmail: 'venue@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: venueOwnerAuthFile,
    expectedPaths: ['/dashboard', '/'],
    role: 'venueOwner',
  });
});

// Authenticate super admin user
setup('authenticate super admin', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_SUPERADMIN_EMAIL',
    passwordEnvVar: 'E2E_SUPERADMIN_PASSWORD',
    defaultEmail: 'superadmin@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: superAdminAuthFile,
    expectedPaths: ['/admin', '/dashboard', '/'],
    role: 'superAdmin',
  });
});
