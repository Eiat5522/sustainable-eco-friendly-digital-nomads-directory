import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { type Page, test as setup } from '@playwright/test';

const storageDir = path.resolve(process.cwd(), 'tests', 'storageStates');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const authFile = path.join(storageDir, 'user.json');
const adminAuthFile = path.join(storageDir, 'admin.json');
const venueOwnerAuthFile = path.join(storageDir, 'venue-owner.json');

type AuthConfig = {
  emailEnvVar: string;
  passwordEnvVar: string;
  defaultEmail: string;
  defaultPassword: string;
  outputPath: string;
  expectedPaths: string[];
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
      return { png, html, logsPath };
    } catch (e) {
      // best-effort: log but don't mask original error
      // eslint-disable-next-line no-console
      console.error('Failed to write debug artifacts:', e);
      return {};
    }
  }

  try {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(
      (url: URL) =>
        expectedPaths.some(p =>
          p === '/' ? url.pathname === '/' : url.pathname === p || url.pathname.startsWith(p + '/')
        ),
      { timeout: 15000 }
    );

    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });

  } catch (err) {
    const artifacts = await dumpDebug('auth-failure');
    const emailHash = createHash('sha256').update(email).digest('hex');
    const artifactParts: string[] = [];
    if (artifacts.png) artifactParts.push(`screenshot=${artifacts.png}`);
    if (artifacts.html) artifactParts.push(`html=${artifacts.html}`);
    if (artifacts.logsPath) artifactParts.push(`logs=${artifacts.logsPath}`);

    throw new Error(
      `Authentication failed for env ${emailEnvVar} (email hash: ${emailHash}). Error: ${err instanceof Error ? err.message : String(err)}. Current URL: ${page.url()}. Artifacts: ${artifactParts.join('; ')}. Console:\n${consoleMessages.join('\n')}`
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
  });
});
