/**
 * Lightweight runtime shim for `@playwright/test` when suites are executed under Jest.
 *
 * Jest occasionally encounters Playwright specs (for example when developers run
 * `jest --runInBand tests/foo.spec.ts`). The real Playwright test runner throws if
 * its API is invoked outside the Playwright context, which resulted in errors such
 * as "Playwright Test did not expect test.describe() to be called here".
 *
 * This shim exports a no-op implementation of the Playwright `test` API together
 * with inert `expect`, `devices`, and `request` utilities so that Jest can safely
 * import these modules without executing any Playwright behaviour.
 */

import { createRequire } from 'node:module';
import type {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test';

const require = createRequire(import.meta.url);

const isPlaywrightRuntime = Boolean(
  process.env.PLAYWRIGHT_TEST || process.env.PLAYWRIGHT_WORKER_ID || process.env.PW_TEST_HTML_REPORT
);

let exportedTest: TestType<
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;
let exportedExpect: typeof import('@playwright/test').expect;
let exportedDevices: typeof import('@playwright/test').devices;
let exportedRequest: typeof import('@playwright/test').request;

const noopAsync = async () => undefined;
const noopSync = () => undefined;

type SafeRequest = Record<string, typeof noopAsync>;

const createNoopRequest = () =>
  new Proxy<SafeRequest>(
    {},
    {
      get: () => noopAsync,
    }
  ) as typeof import('@playwright/test').request;

type ModifierType = {
  skip: typeof noopSync;
  only: typeof noopSync;
  fixme: typeof noopSync;
  fail: typeof noopSync;
  slow: typeof noopSync;
  step: typeof noopAsync;
  setTimeout: typeof noopSync;
};

const attachNoopModifiers = <T extends Partial<ModifierType>>(fn: T): T => {
  const modifiers: ModifierType = {
    skip: noopSync,
    only: noopSync,
    fixme: noopSync,
    fail: noopSync,
    slow: noopSync,
    step: noopAsync,
    setTimeout: noopSync,
  };
  Object.assign(fn, modifiers);
  return fn;
};

type NoopDescribe = ((...args: unknown[]) => void) & {
  only: typeof noopSync;
  skip: typeof noopSync;
  parallel: typeof noopSync;
  serial: typeof noopSync;
  configure: typeof noopSync;
};

const createNoopDescribe = (): NoopDescribe => {
  const describe = ((..._args: unknown[]) => undefined) as NoopDescribe;
  describe.only = noopSync;
  describe.skip = noopSync;
  describe.parallel = noopSync;
  describe.serial = noopSync;
  describe.configure = noopSync;
  return describe;
};

type PlaywrightTestType = TestType<
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;

type NoopTest = PlaywrightTestType & {
  beforeAll: typeof noopAsync;
  afterAll: typeof noopAsync;
  beforeEach: typeof noopAsync;
  afterEach: typeof noopAsync;
  use: typeof noopSync;
  extend: () => NoopTest;
  describe: NoopDescribe;
  info: PlaywrightTestType['info'];
};

const createNoopTest = (): NoopTest => {
  const testFn = ((..._args: unknown[]) => undefined) as NoopTest;

  testFn.beforeAll = noopAsync;
  testFn.afterAll = noopAsync;
  testFn.beforeEach = noopAsync;
  testFn.afterEach = noopAsync;
  testFn.use = noopSync;
  testFn.extend = () => testFn;
  testFn.describe = createNoopDescribe();
  testFn.info = () => ({
    project: { name: 'jest-playwright-stub', use: {} },
    workerIndex: 0,
    config: {},
    retries: 0,
    retry: 0,
    title: '',
    testId: '',
    relativeArtifactsPath: '',
    outputDir: '',
    snapshotDir: '',
    repeatEachIndex: 0,
    expectedStatus: 'passed',
  });

  attachNoopModifiers(testFn);
  return testFn;
};

if (isPlaywrightRuntime) {
  const playwright = require('@playwright/test') as typeof import('@playwright/test');
  exportedTest = playwright.test;
  exportedExpect = playwright.expect;
  exportedDevices = playwright.devices;
  exportedRequest = playwright.request;
} else {
  exportedTest = createNoopTest();
  exportedExpect = ((..._args: unknown[]) => {
    throw new Error('Playwright expect is unavailable outside the Playwright test runner');
  }) as typeof import('@playwright/test').expect;
  exportedDevices = {} as typeof import('@playwright/test').devices;
  exportedRequest = createNoopRequest();
}

export const test = exportedTest;
export const expect = exportedExpect;
export const devices = exportedDevices;
export const request = exportedRequest;
const playwrightJestStub = {
  test,
  expect,
  devices,
  request,
};

export default playwrightJestStub;
