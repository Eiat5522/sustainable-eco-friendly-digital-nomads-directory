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

type NoopModifiers = {
  skip: () => void;
  only: () => void;
  fixme: () => void;
  fail: () => void;
  slow: () => void;
  step: (...args: unknown[]) => Promise<void>;
  setTimeout: (timeout?: number) => void;
};

type NoopModifiableFn = ((...args: unknown[]) => unknown) & Partial<NoopModifiers>;

type NoopDescribe = ((...args: unknown[]) => void) & {
  only: () => void;
  skip: () => void;
  parallel: () => void;
  serial: () => void;
  configure: () => void;
};

type NoopTestFn = ((...args: unknown[]) => void) &
  NoopModifiers & {
    beforeAll: () => Promise<void>;
    afterAll: () => Promise<void>;
    beforeEach: () => Promise<void>;
    afterEach: () => Promise<void>;
    use: () => void;
    extend: () => NoopTestFn;
    describe: NoopDescribe;
    info: () => {
      project: { name: string; use: Record<string, unknown> };
      workerIndex: number;
      config: Record<string, unknown>;
      retries: number;
      retry: number;
      title: string;
      testId: string;
      relativeArtifactsPath: string;
      outputDir: string;
      snapshotDir: string;
      repeatEachIndex: number;
      expectedStatus: 'passed';
    };
  };

const createNoopRequest = () =>
  new Proxy(
    {},
    {
      get: () => noopAsync,
    }
  ) as unknown as typeof import('@playwright/test').request;

const attachNoopModifiers = (fn: NoopModifiableFn) => {
  fn.skip = noopSync;
  fn.only = noopSync;
  fn.fixme = noopSync;
  fn.fail = noopSync;
  fn.slow = noopSync;
  fn.step = noopAsync;
  fn.setTimeout = noopSync;
  return fn;
};

const createNoopDescribe = () => {
  const describe = ((..._args: unknown[]) => undefined) as NoopDescribe;
  describe.only = noopSync;
  describe.skip = noopSync;
  describe.parallel = noopSync;
  describe.serial = noopSync;
  describe.configure = noopSync;
  return describe;
};

const createNoopTest = () => {
  const testFn = ((..._args: unknown[]) => undefined) as NoopTestFn;

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
  return testFn as TestType<
    PlaywrightTestArgs & PlaywrightTestOptions,
    PlaywrightWorkerArgs & PlaywrightWorkerOptions
  >;
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
