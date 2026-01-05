import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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

async function authenticateUser(page: Page, config: AuthConfig) {
  const { emailEnvVar, passwordEnvVar, defaultEmail, defaultPassword, outputPath, expectedPaths } =
    config;

  // Collect console messages and page errors for richer debugging
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => consoleMessages.push(`pageerror: ${err.message}`));

  const email = process.env[emailEnvVar] || defaultEmail;
  const password = process.env[passwordEnvVar] || defaultPassword;

  if (!email || !password) {
    throw new Error(
      `Missing credentials for env vars ${emailEnvVar}/${passwordEnvVar}. Email present: ${Boolean(email)}, Password present: ${Boolean(password)}`
    );
  }

  const debugBase = path.join(storageDir, path.basename(outputPath, path.extname(outputPath)));

  type DebugArtifacts = { png?: string; html?: string; logsPath?: string };

  async function dumpDebug(suffix = 'error'): Promise<DebugArtifacts> {
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

      return { png, html, logsPath };
    } catch (e) {
      // best-effort: log but don't mask original error
       
      console.error('Failed to write debug artifacts:', e);
      return {};
    }
  }

  let hasAuthenticated = false;
  let authError: unknown;
  let artifacts: DebugArtifacts | null = null;

  try {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]', { noWaitAfter: true });

    await page.waitForURL(
      (url: URL) =>
        expectedPaths.some(p =>
          p === '/' ? url.pathname === '/' : url.pathname === p || url.pathname.startsWith(p + '/')
        ),
      { timeout: 15000 }
    );
    hasAuthenticated = true;
  } catch (err) {
    authError = err;
    artifacts = await dumpDebug('auth-failure');
  }

  if (!hasAuthenticated && config.role) {
    try {
      await loginAs(page, config.role, { redirectTo: expectedPaths[0] ?? '/' });
      hasAuthenticated = true;
    } catch (fallbackError) {
      const emailHash = createHash('sha256').update(email).digest('hex');
      const artifactParts: string[] = [];
      if (artifacts?.png) artifactParts.push(`screenshot=${artifacts.png}`);
      if (artifacts?.html) artifactParts.push(`html=${artifacts.html}`);
      if (artifacts?.logsPath) artifactParts.push(`logs=${artifacts.logsPath}`);

      throw new Error(
        `Authentication failed for env ${emailEnvVar} (email hash: ${emailHash}). UI error: ${authError instanceof Error ? authError.message : String(authError)}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}. Current URL: ${page.url()}. Artifacts: ${artifactParts.join('; ')}. Console:\n${consoleMessages.join('\n')}`
      );
    }
  }

  if (!hasAuthenticated) {
    const emailHash = createHash('sha256').update(email).digest('hex');
    const artifactParts: string[] = [];
    if (artifacts?.png) artifactParts.push(`screenshot=${artifacts.png}`);
    if (artifacts?.html) artifactParts.push(`html=${artifacts.html}`);
    if (artifacts?.logsPath) artifactParts.push(`logs=${artifacts.logsPath}`);

    throw new Error(
      `Authentication failed for env ${emailEnvVar} (email hash: ${emailHash}). Error: ${authError instanceof Error ? authError.message : String(authError)}. Current URL: ${page.url()}. Artifacts: ${artifactParts.join('; ')}. Console:\n${consoleMessages.join('\n')}`
    );
  }

  // Save storage state after successful authentication
  try {
    await page.context().storageState({ path: outputPath });
  } catch (err) {
    const artifacts = await dumpDebug('storageState-failure');
    throw new Error(
      `Failed to write storage state to ${outputPath}: ${err instanceof Error ? err.message : String(err)}. Debug: ${JSON.stringify(artifacts)}. Console:\n${consoleMessages.join('\n')}`
    );
  }
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
