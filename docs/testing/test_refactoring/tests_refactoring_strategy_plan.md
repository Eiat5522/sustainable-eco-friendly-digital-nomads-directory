# Unit Testing in a Modern JavaScript Ecosystem (CJS to ESM Transition)
## Introduction

Transitioning a codebase from CommonJS (CJS) to ECMAScript Modules (ESM) affects how you write and run unit tests. Jest – as the testing framework – has historically been optimized for CJS, but it now offers experimental ESM support. In a project targeting both Node.js and browser environments (with build tooling like esbuild), tests must accommodate both module systems during the migration. This guide provides best practices for unit testing in such a hybrid ecosystem. We focus on how to configure Jest for CJS/ESM, strategies to mock external dependencies (third-party libraries, APIs, databases) in both environments, ensuring test isolation, cross-environment (Node vs browser) compatibility, and tips for a gradual migration to fully ESM. The goal is to help developers maintain reliable, isolated unit tests throughout the transition.
Setting Up Jest for CJS and ESM Coexistence
To run tests on both CommonJS and native ESM modules, you need to adjust Jest's configuration and how you invoke it:
Enable ESM in Jest: Jest’s ESM support is still experimental (as of Jest 30) and requires Node’s VM modules API
jestjs.io
. Activate it by running Node with the --experimental-vm-modules flag. For example, in your package.json script:
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  }
}
This flag allows Jest to load ESM test files using Node's experimental loader
jestjs.io
.
Jest Config for ESM: Ensure Jest doesn’t transform ESM to CJS unintentionally. In jest.config.js, disable default transforms or use an ESM-compatible transformer. For example, to disable transforms entirely:
// jest.config.cjs (if your project is still CJS)
module.exports = {
  transform: {},                // do not transform code (preserve ESM)
  extensionsToTreatAsEsm: ['.ts', '.jsx'], // treat these as ESM if needed
  testEnvironment: 'node'       // default Node environment (change per test as needed)
};
Here we set transform: {} to prevent Jest from converting imports/exports to require/module.exports
sitepen.com
sitepen.com
. We also specify file extensions to treat as ESM (e.g. TypeScript or JSX) so Jest knows to load them as modules
jestjs.io
. If your project’s package.json has "type": "module", remember to use an ESM format config (e.g. jest.config.js exporting export default {...}) or rename it with a .cjs extension
jenchan.biz
.
Using esbuild for transforms: If your code uses TypeScript or non-standard syntax, you can leverage esbuild to compile tests instead of Babel. An esbuild-based Jest transformer (like esbuild-jest) can compile TS/JSX quickly. For example, in jest.config:
module.exports = {
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest'  // use esbuild to transpile TS/JS files
  },
  // ...other settings
};
This compiles files with esbuild before running tests

. Make sure the transformer outputs a format compatible with your Jest run mode. If you are running Jest without --experimental-vm-modules (i.e. in normal CJS mode), the transform should output CommonJS. If using ESM mode, configure the transformer (if possible) to output ESM, or disable it and let Node handle ESM natively.
Node vs browser environment: By default, Jest runs tests in a Node-like environment (no DOM)
browserstack.com
. This is ideal for backend or library code. For code that interacts with browser APIs (DOM, window, etc.), use JSDOM as the test environment. You can set "testEnvironment": "jsdom" in Jest config or use per-file annotations like /** @jest-environment jsdom */. Ensure your tests that require a DOM run with jsdom, while others use Node. It’s possible to configure Jest projects to run two sets of tests – one under node, one under jsdom – if you need to systematically separate environment-specific tests


Example: If your repository has both server and client code, you might name tests for browser code with a suffix (e.g. .browser.test.js) and use a Jest projects config to run those with jsdom and others with Node. This guarantees that each test runs in an environment that simulates the target platform (Node APIs available in Node tests, DOM APIs available in browser tests).
Gradual Migration Strategies (CommonJS to ESM)
A gradual transition means you will have a mix of module types for some time. Here are strategies to handle this mix gracefully:
Mixed Module Types: You can keep existing CJS modules and tests working while writing new modules in ESM. Node.js allows ESM to import CommonJS modules and vice versa (with some caveats). For instance, an ESM module can import pkg from 'old-cjs-package' – the CommonJS export will be available as a default export. Conversely, a CommonJS module can load an ESM module using dynamic import() (since require() cannot load ESM directly). In practice, consider refactoring gradually: update internal imports to ESM syntax and use file extensions (.mjs/.cjs) to let Node know the format
jenchan.biz
. For example, you might rename new module files to .mjs and legacy ones to .cjs so both can coexist without confusion
jenchan.biz
.
Dual Package Config: During migration, you might maintain "type": "commonjs" in package.json for compatibility, but still write ESM files with .mjs extension. Alternatively, set "type": "module" and rename old files with .cjs as needed
jenchan.biz
. Either way, ensure your import paths include the proper extensions when required (Node ESM requires exact file extensions or package exports field).
Jest Handling for Mixed Code: If using Jest’s experimental ESM support, it will follow Node’s logic to determine module type
jestjs.io
. This means in one test run you can import both .cjs and .mjs files. For example, from an ESM test, you can still use createRequire to require a CJS module or dynamically import a CJS file (which yields its module.exports as a .default)
jestjs.io
. Jest will allow both, as shown below:
// ESM test file (e.g. using top-level await)
import { createRequire } from 'node:module';
import { jest } from '@jest/globals';
const require = createRequire(import.meta.url);

// Mock a CJS dependency before requiring it:
jest.mock('old-cjs-lib', () => ({ /* fake implementation */ }));

const oldLib = require('old-cjs-lib');           // require CJS module (gets the mock)
const newModule = await import('./newModule.mjs'); // import ESM module
In this snippet, we use jest.mock on a CommonJS library and then require it, ensuring the mock is applied
jestjs.io
jestjs.io
. Meanwhile, we can import an ESM module normally. This approach lets you test both module types side by side.
Transpile as a Stopgap: If Jest’s ESM support or mixed modules prove too troublesome (for example, you run into the "SyntaxError: Cannot use import statement outside a module" issues
jenchan.biz
), a pragmatic approach is to transpile ESM to CJS for testing during the interim. Tools like Babel or ts-jest can down-compile your ESM code to CommonJS just for running tests
jenchan.biz
. This allows you to continue using jest.mock and other CommonJS-era conveniences until you are ready to fully embrace ESM in tests. However, be cautious – this is essentially reverting to legacy behavior. The end goal should be to run tests on native ESM modules, so use this tactic as a temporary measure.
Package Boundaries: If only parts of the project are ESM, consider isolating them. Some teams spin up a separate package or workspace for the new ESM code (with its own jest config and "type": "module"), and keep the rest CJS. This modular approach can minimize friction: the ESM part can be tested with ESM support while the CJS part uses classic Jest. Over time, the CJS parts can be refactored into the ESM package.
By gradually migrating in this way, you can continually run tests to ensure nothing breaks, while incrementally moving to the modern module system. The key is to keep testing configuration flexible and cover all modules, regardless of their type.
Mocking External Dependencies: Overview
One of the core principles of unit testing is isolation. Tests should not rely on real external systems or modules that can introduce flakiness or complexity
medium.com
. External dependencies include third-party libraries, network APIs, databases, or any module outside the unit under test. To keep tests reliable and fast, you replace these with mocks – controlled fake implementations. This ensures that running the same test repeatedly yields the same result (no reliance on network speed, API availability, database state, etc.)
medium.com
. There are two primary approaches to injecting such fakes:
Dependency Injection (DI): Design your functions or classes to accept collaborators as parameters. In tests, you can pass in a mock or stub object. This is a simple and flexible approach because your test directly controls the dependency. It’s one reason to favor DI in your application architecture
medium.com
. For example, instead of a module directly importing a database client, it could export a function that accepts a DB client instance as an argument.
Module Monkey-Patching: If the code directly imports a module (without DI), you can use Jest's mocking facilities to replace the imported module with a fake. Jest provides a built-in mocking system that can intercept require() or import calls and substitute your own module. This is done via jest.mock(...) in CommonJS or the newer jest.unstable_mockModule(...) for ESM. This approach lets you simulate modules that your code under test imports, without changing the code to accept injected dependencies
medium.com
. It’s very powerful for replacing libraries (like replacing the axios HTTP client with a stub) or any side-effectful module.
Best practice: Use DI where feasible for new code (it makes testing easier), but when code directly imports externals, leverage Jest’s mocking to control those dependencies in tests. In the sections below, we cover how to mock modules in both CJS and ESM contexts, and specific strategies for third-party libraries, APIs, and databases.
Mocking in CommonJS (Jest Classic Mocking)
In a CommonJS context (or when Jest transpiles ESM to CJS under the hood), mocking modules is straightforward using jest.mock:
Basic jest.mock: To mock an imported module, call jest.mock('module-name', factory) at the top of your test file (or at least before the module under test is imported). Jest will replace any import of that module with the mock. For example, if your code under test does const db = require('./db') and calls db.get() and db.set(), you can do:
// db.test.js (CommonJS test file)
const mockDb = { get: jest.fn(), set: jest.fn() };
jest.mock('./db', () => mockDb);

const { addTodo, getTodo } = require('./moduleUnderTest');  // this module imports ./db internally

test('addTodo uses db.set', async () => {
  await addTodo({ name: 'task1' });
  expect(mockDb.set).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'task1' }));
});

test('getTodo uses db.get', async () => {
  mockDb.get.mockResolvedValue({ id: 1, name: 'task1' });
  const result = await getTodo(1);
  expect(mockDb.get).toHaveBeenCalledWith('todos:1');
  expect(result).toEqual({ id: 1, name: 'task1' });
});
In this snippet, jest.mock('./db', ...) replaces the real ./db module with our mockDb object. The tests verify that our module under test interacts with db correctly, without actually hitting a database. The call to jest.mock must come before requiring the module under test, so that the import is intercepted
codewithhugo.com
codewithhugo.com
. (Jest’s Babel transform usually hoists jest.mock calls to ensure this order
codewithhugo.com
.)
Factory vs Automatic mocks: We provided a factory function to jest.mock that returns our fake module. This is useful for creating custom mocks. Alternatively, if you call jest.mock('some-module') with no second argument, Jest will attempt to auto-mock it (especially if you have automock: true configured or if there's a manual mock in a __mocks__ directory). In practice, providing a factory gives you explicit control over the mock’s behavior. Note that inside the factory, if you reference variables from the test scope, you should prefix them with mock (e.g. mockDb as above) to avoid issues with hoisting
codewithhugo.com
codewithhugo.com
.
Partial mocks and spies: Sometimes you want to mock or spy on only part of a module. In CommonJS, you can require the actual module and then override or spy on specific exports. For example, if a module exports multiple functions, you might use jest.requireActual inside the factory to get the real implementation and then override one function:
const actualUtils = jest.requireActual('./utils');
jest.mock('./utils', () => ({
  ...actualUtils,
  formatData: jest.fn(() => 'test')  // override one function
}));
This keeps other functions intact and only mocks formatData. Another approach is to use jest.spyOn to spy on a function either on an imported object or module exports. For instance:
const utils = require('./utils');
jest.spyOn(utils, 'formatData').mockImplementation(() => 'test');
This replaces utils.formatData with a mock for the duration of the test, but leaves other exports alone. Spying is especially handy if the module under test imports an object and uses its methods, or if you have an instance where you can replace methods. (Keep in mind that if a module directly uses a function defined internally, you may need to adjust the design to be able to spy on it. For example, export the function or attach it to an object. If the function is truly internal and not exported, it's better to test it via the public API rather than trying to reach in and mock it
codewithhugo.com
codewithhugo.com
.)
Resetting and clearing: With Jest mocks, each test should ideally start with a clean slate. Use afterEach(() => { jest.resetAllMocks(); jest.restoreAllMocks(); }) to reset mock implementation and call history for the next test. jest.resetModules() can also be used if you need to re-require modules afresh (this clears the require cache between tests in the same file). However, Jest by default isolates each test file in its own sandbox, so global state isn't shared across files
medium.com
. Within a single file, manual resets help prevent tests from affecting each other.
In summary, CommonJS module mocking with Jest is mature and straightforward: define your mock before loading the module under test, use jest’s tools to inspect usage (toHaveBeenCalledWith etc.), and reset between tests for isolation. This allows you to simulate databases, network clients, or any library. For example, mocking a third-party library like Axios in CJS is as easy as jest.mock('axios') and then setting axios.get.mockResolvedValue(fakeData) in your test, since axios (being CJS) will be replaced by a mock with the same shape.
Mocking in ECMAScript Modules (Jest’s ESM Mode)
When your code and tests are running as native ESM, mocking works a bit differently due to ESM’s static import structure. In ESM, all imports are resolved and loaded before any test code executes, so you cannot call jest.mock() after an import the same way you can in CJS
jestjs.io
. Jest’s normal module hoisting tricks don’t apply in ESM mode. Instead, Jest provides a new API: jest.unstable_mockModule() for ESM mocks
jestjs.io
. Key points and best practices for ESM mocking:
Use jest.unstable_mockModule: This function (available since Jest 27) is the ESM-compatible way to mock. Its usage is similar to jest.mock but requires a factory callback and returns a promise when you import the module. For example:
import { jest } from '@jest/globals';
// Prepare an ESM module mock
jest.unstable_mockModule('node-fetch', () => ({
  // mock the default export and/or named exports
  default: jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })),
  // ...other exports if needed
}));

// Now import the module under test *after* setting up the mocks
const { fetchData } = await import('../src/dataFetcher.js');

// Inside dataFetcher.js, it does: import fetch from 'node-fetch'
// Our unstable_mockModule ensured that import is replaced with the fake.
In this snippet, we mock 'node-fetch' (which might be used inside dataFetcher) before importing dataFetcher.js. The import of the module under test is done dynamically (await import) after the mocks are in place
jestjs.io
sitepen.com
. This is crucial: you must import modules that use the mocked dependencies after calling unstable_mockModule, because ESM imports are evaluated in load order
jestjs.io
. You can use top-level await in your test file (if it's an ESM test file) or structure your tests with beforeAll(async () => { ... await import(...) }) to ensure the timing.
Factory function requirement: Unlike jest.mock, the factory for jest.unstable_mockModule is mandatory and can be asynchronous
jestjs.io
. This means you cannot rely on automatic loading of a manual mock file. If you had a file in __mocks__, you should explicitly import it in the factory. For example, jest.unstable_mockModule('./db.js', () => import('./__mocks__/db.js')); will load your ESM mock module
sitepen.com
. The factory can also just return an object literal (as in the above example, returning an object with fake functions). Being asynchronous allows you to perform dynamic imports inside it if needed.
No hoisting – order matters: With CJS, Jest would hoist jest.mock calls above imports so you often wrote them below imports in code order and it still worked
codewithhugo.com
. In pure ESM tests, you must declare your mocks first, then import. A common pattern is to put all jest.unstable_mockModule calls at the top of the test file, then use await import() to bring in the module under test. Alternatively, you can use import {jest} from '@jest/globals' and do setup in a beforeAll block in your tests. But the simplest is leveraging top-level await in the test file as shown.
Importing the mocked module: After calling unstable_mockModule for a given module, when you later import that module (or any module that imports it), Jest will return the mocked version
jestjs.io
. However, note that once you import an ESM module, its evaluation is cached (by ESM semantics). If you need to reset a module, you cannot simply require it again like in CJS; you'd have to use jest.resetModules() which may not fully work with ESM, or better, structure separate tests in separate files/processes for clean state. Jest does provide jest.unstable_resetModulePathCache() and related APIs, but these are advanced uses. Generally, design tests so that each test file sets up the needed mocks and imports the module fresh.
Mocking CommonJS modules while in ESM tests: If your code (or third-party libs) are still CommonJS, you can still mock them using jest.mock even in an ESM test file. The official Jest docs illustrate that you can use createRequire to bring in CJS modules and Jest will apply the mock
jestjs.io
jestjs.io
. For example:
import { createRequire } from 'node:module';
import { jest } from '@jest/globals';
const require = createRequire(import.meta.url);

jest.mock('electron', () => ({ 
  app: { on: jest.fn(), whenReady: jest.fn(() => Promise.resolve()) },
  BrowserWindow: jest.fn()
}));

const { BrowserWindow } = require('electron');  // will get the mocked BrowserWindow
const main = require('../src/main.cjs');        // require the module under test (which uses 'electron')
In this scenario, we treat 'electron' (a CJS module) to a normal jest.mock call. The require('electron') that happens afterwards returns our mock object
jestjs.io
jestjs.io
. This demonstrates that even under ESM tests, you can lean on the classic jest.mock for purely CJS dependencies. The rest of the test can then use main (the module under test) and verify it uses BrowserWindow or app as expected.
ESM Test Syntax Differences: One difference in ESM tests is the global jest object isn’t automatically available. You should import what you need from @jest/globals in an ESM module
jestjs.io
. For example, import {jest, describe, it, expect} from '@jest/globals'. You can also access jest via import.meta.jest
jestjs.io
. This is just a structural change to be aware of – functionally, jest.mock or jest.unstable_mockModule behave the ways described above.
In summary, mocking in ESM requires an explicit, async approach. Set up your mocks first using jest.unstable_mockModule, then import the module under test. While this involves more boilerplate (and currently an experimental API), it achieves the same goal: isolating external dependencies. As Jest and the ecosystem mature, we can expect this process to become smoother, but as of now these are the best practices to follow
sitepen.com
sitepen.com
.
Mocking Third-Party Libraries and APIs
Modern applications often rely on third-party libraries for data fetching, analytics, etc., and call external APIs. In unit tests, you typically do not want to invoke real HTTP calls or use real API keys. Here’s how to handle these:
HTTP clients (Axios, fetch, etc.): If your code uses a library like Axios, you can easily mock it. Since Axios is a module, just use jest.mock('axios'). This will replace axios with an auto-mock object where you can set axios.get = jest.fn() and so on. For example:
import { jest } from '@jest/globals';
import axios from 'axios';
jest.mock('axios');

import { fetchUserData } from './api-client.js';  // function that calls axios.get internally

test('fetchUserData returns transformed result', async () => {
  axios.get.mockResolvedValue({ data: { name: 'Alice' } });
  const result = await fetchUserData(123);
  expect(axios.get).toHaveBeenCalledWith('/users/123');
  expect(result).toEqual({ name: 'Alice' });
});
This way, no real HTTP call is made – we control axios’s behavior. If your code uses the global fetch API instead, you have a few options:
Use a polyfill and mock it: In Node, global.fetch may not be available (unless you’re on Node 18+ where fetch is experimental). You can install a package like cross-fetch or node-fetch and set it up for tests. Then spy on or stub it. For example, global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(fakeData) }));.
Use Mock Service Worker (MSW): MSW is a library that intercepts network calls at the network layer. It works in Node (via a simulated server) and in browsers (via Service Worker). You can define request handlers that return fake responses. In tests, you start the MSW server and it will catch fetch calls. This approach is slightly heavier but very powerful for simulating realistic API interactions. One developer found that Nock (a popular HTTP mocking library) did not work for fetch calls in Node, so they switched to MSW which “worked flawlessly”
dev.to
dev.to
. For example, you can define an MSW handler for a URL and return a canned JSON response, then in tests, initialize MSW before calling your function that does fetch
dev.to
dev.to
. MSW ensures that even though fetch is called, it never leaves your test environment – the request is served by the mock server in-memory.
External API integrations: For any code that integrates with external services (OAuth providers, cloud services, etc.), apply similar principles. If there is an SDK (which might be a package), you can jest.mock that SDK. For example, if using AWS SDK, you might mock the specific client’s methods to avoid making real calls. Many such SDKs also allow you to provide a custom endpoint (e.g., pointing to localhost) – for integration tests you might run a local emulator, but for unit tests, just stub the methods.
Using Nock or similar for Node HTTP: If your code uses Node’s http/https modules (or libraries that use them under the hood), Nock is a popular library to intercept HTTP requests and supply mock responses. It monkey-patches Node’s http module. You can set up Nock in a test to listen for a specific URL and reply with given data. Example:
const nock = require('nock');
nock('https://api.example.com')
  .get('/users/123')
  .reply(200, { name: 'Alice' });

// call the function that uses https.get or axios to that URL
After the function call, you can assert the return value. Nock will have intercepted the request. Note: Nock works well for Node's native HTTP or libraries built on it, but as noted, it won’t catch global fetch calls in Node’s experimental fetch implementation
dev.to
. For fetch, prefer MSW or the global.fetch approach.
GraphQL/APIs with specific clients: If using a GraphQL client or other specialized library, see if the library offers a testing mode or if you can inject a transport. For example, Apollo Client allows injecting a custom network interface – in tests you can provide one that returns predefined results.
Best practice: Keep your API-calling code separated from business logic so it’s easier to mock. For instance, a function that calls an API could accept the HTTP client as a parameter (so you pass a mock), or the function simply wraps an HTTP call that you can intercept via jest.mock or tools like MSW. The goal is to ensure tests never depend on actual external calls. Instead, you simulate various responses (success, error, timeouts, etc.) by controlling the mocks.
Mocking Database Dependencies
Database interactions should also be kept out of real unit tests. Hitting a real database is slow and introduces external state. Here’s how to handle DB dependencies:
Abstract the DB: If your code directly imports a database client or ORM, consider abstracting those calls behind a module or interface. For example, instead of sprinkling MongoClient.connect() everywhere, have a module db.js that exports database access functions (getUserById, saveOrder, etc.). Then in tests, you can mock that module. This way you’re not mocking low-level DB calls but higher-level data access functions.
Jest mock for DB modules: If using an ORM or client library, use jest.mock('db-library') or jest.mock('./path/to/db') to stub its methods. For instance, if you have import { PrismaClient } from '@prisma/client' in your code, you could do:
jest.mock('@prisma/client', () => {
  const mClient = {
    user: { findUnique: jest.fn(), create: jest.fn() }
    // ... stub whatever methods you use
  };
  return { PrismaClient: jest.fn(() => mClient) };
});
This would intercept the PrismaClient class, making it return a fake client with stubbed methods. Then you can control mClient.user.findUnique.mockResolvedValue({id: 1, name: 'Alice'}) in tests to simulate DB queries, without any actual DB.
In-memory databases for integration tests: While unit tests should mock, you might have a layer of tests that are integration-like (to verify the database integration works). For those, tools like sqlite3 in-memory or mongodb-memory-server can spin up a quick ephemeral database. This isn’t exactly unit testing, but it’s a strategy to test DB logic without an external dev database. For example, if using Mongoose (MongoDB ODM), you could use mongodb-memory-server to provide a MongoDB instance in RAM for the duration of tests. However, this is slower and more complex than pure unit tests, so use it sparingly and prefer mocking for unit tests of business logic.
Reset state: If you do use any real or in-memory database in testing, ensure to clear data between tests (or use Jest’s global setup/teardown to reset the DB). With pure mocks, this isn’t an issue – you just reset the mock calls. But it’s worth noting for completeness: test isolation means if one test adds a record to a DB, the next test shouldn’t see it, or tests might pass/fail depending on order. This is why unit tests avoid a real DB entirely.
Example: Suppose your code uses a module redisClient.js which exports a configured Redis client from the redis package. In a unit test for code that calls redisClient.set() and redisClient.get(), do:
jest.mock('../utils/redisClient', () => ({
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue('value'),
}));
import { cacheData } from '../services/cacheService';  // function that calls redisClient.set
// ...test cacheData without a real Redis
This way, even though cacheData calls redisClient.set, our mock intercepts it and pretends it's successful, allowing us to verify that set was called with the right parameters. In summary, treat databases as another external service: simulate them. Either mock the DB library calls or better, mock a higher-level data access layer. This keeps unit tests fast and deterministic, focusing on how your code handles data rather than testing the database itself.
Test Isolation and Best Practices
Ensuring tests are isolated from each other and from external state is crucial:
Independent Tests: Each test (each it/test block) should be able to run alone and still pass. This means no test should rely on another test’s side effects or on shared state. Jest helps by running test files in separate processes and clearing the module registry between them
medium.com
. Within a file, you should avoid reusing mutated state across tests. For example, if you have a module that caches something on import, and you want to test two different scenarios, call jest.resetModules() to get a fresh copy of the module for each test, or structure your code to allow injection of state for testing.
beforeEach/afterEach for cleanup: Use beforeEach to set up consistent initial state and afterEach to teardown or reset. Common patterns:
afterEach(() => jest.clearAllMocks()) – this resets call counts of mocks without removing their implementations, useful if you set up a mock implementation in a higher scope and just want to clear usage data.
afterEach(() => jest.resetAllMocks()) – resets mocks to their original implementation (or empties, if they were jest.fn()). Use this if you want to completely reset how the mocks behave for each test.
If using fake timers (jest.useFakeTimers()), do afterEach(() => jest.useRealTimers()) to avoid interference with other tests.
Clean up any global stubs you set (e.g., if you did global.fetch = jest.fn(), delete or restore it after the test).
Avoid global state in modules: If a module sets up a singleton or caches data at import time, it can make testing tricky. Consider refactoring such modules to expose a factory function or to reset their internal state. Jest’s jest.resetModules() can force a module to re-import, but it's better to manage state explicitly if possible. For example, if you have a config module that reads env vars on import, in tests you might want to simulate different env vars. Instead of relying on resetting modules, refactor the config to be a function that reads process.env when called, or allow overriding it in tests.
Test only one unit: A unit test should focus on one piece of logic. If you find you need to have multiple real modules working together, that’s more of an integration test. Unit tests should stub or mock any other module so that you isolate the code under test. This makes failures easier to diagnose and ensures you’re testing the logic of the unit, not the interaction (interaction testing is for integration tests). As a rule of thumb from the testing community: Don't mock what you don't own. In other words, you mock the boundaries – your calls to a database, a network, a library – but not the internals of your own module's logic. For your own complex modules, test their internals via their public API instead of mocking internal functions (mocking internals can lead to brittle tests
codewithhugo.com
).
Cross-environment concerns: When writing tests for code that needs to run in both Node and browser, you may need to simulate or abstract environment differences. For example, if a module uses window.localStorage in the browser, in a Node test environment you might get a ReferenceError. Solutions:
Use JSDOM environment so that window and localStorage exist (they will be polyfilled by jsdom).
Or inject a storage dependency so you can pass a mock in Node tests.
Or conditionally handle it in code (e.g., const storage = (typeof window !== 'undefined') ? window.localStorage : fakeStorage; and in Node tests define global.fakeStorage).
Also, ensure any code that behaves differently based on environment is covered by tests in each mode. For instance, if a function switches logic if process.browser is true (meaning running in browser), have tests that run under that condition (you can set process.browser = true in a jsdom test, for example, to simulate the browser flag).
Gradually enforce best practices: As you migrate to ESM and newer tools, continuously refine your tests. Remove deprecated practices (like using done callbacks where you can use async/await, or old Jest functions that might be updated). Ensure your Jest configuration in the end state is minimal and clear – often after fully migrating to ESM, you can remove many workarounds. For example, once everything is ESM, you might drop the --experimental-vm-modules flag when it becomes stable, or remove jest.mock calls in favor of the new APIs once they stabilize.
Conclusion
Transitioning from CommonJS to ESM in a Node+browser project requires careful adjustment of testing strategies. Jest configuration must accommodate both module types – initially via transpilers or experimental flags, and eventually natively. During the transition, leveraging file extensions and Node’s dual module support will let you test old and new modules side by side. The cornerstone of unit testing remains isolation: we achieve this via robust mocking strategies. In CommonJS, Jest’s jest.mock (with manual or auto mocks) lets us stub out libraries, APIs, and databases with ease, ensuring our tests don’t hit real externals. In the ESM world, we adapt to use jest.unstable_mockModule and dynamic imports to accomplish the same, acknowledging the different mechanics of ESM. We also integrate specialized tools like MSW or Nock when appropriate to handle network calls elegantly. Throughout, maintaining test isolation and cross-environment compatibility is key. Use the right environment for the right test, reset state between tests, and gradually refactor code to be more testable (e.g., using dependency injection or clearly separated modules). By following these best practices, you can keep your test suite reliable and efficient, even as the underlying module system of your project evolves. This ensures that the eventual full ESM conversion is achieved with confidence in your tests, and your applications’ quality remains high. References:
Jest Documentation – ECMAScript Modules (ESM) Support
jestjs.io
jestjs.io
Jest Documentation – Mocking CommonJS vs ESM Modules
jestjs.io
jestjs.io
Bregwin Jogi, Testing Troubles with Jest & ESM (Dev.to, Nov 2024) – ESM configuration and mocking example
dev.to
dev.to
Jason Cheatham, Jest + ESM: Almost There… (SitePen Blog, 2022) – Differences in ESM mocking
sitepen.com
sitepen.com
Dominic Fraser, Mocking ES and CommonJS modules with jest.mock() (CodeClan, 2018) – Rationale for mocking and DI vs jest.mock
medium.com
medium.com
Code with Hugo – Jest Mock/Spy Module Imports (2019) – Advanced mocking patterns and partial mocks
codewithhugo.com
codewithhugo.com
BrowserStack Guide – How to Configure Jest (Aug 2025) – Notes on Jest environments (Node vs jsdom)
browserstack.com
.





Sources
You said:
Branch: revert-2/detail-pages

Using the information gathered from the above deep research, analyse the current test setup of the repository and make recommendations on the testing strategy the repo should adopt (solution must be future proof, so no usage of any unstable features). Priority would be to refactor tests that relies on 3rd party systems i.e. Sanity, MongoDB (Mongoose) and Redis. Then prioritized the ui components next, then the rest.
ChatGPT said:
To provide precise recommendations, could you confirm a few details:

Should the analysis be limited to the revert-2/detail-pages branch only, or should I also compare it with other branches (e.g. main or development)?

Is the codebase currently using CommonJS, ESM, or a mix?

Do you want the recommendations as inline PR comments, a written report, or both?

Should I implement code changes (e.g. mock setup files, test refactors), or just outline what should be done?

This will help tailor the testing strategy recommendations more effectively.

You said:
Should the analysis be limited to the revert-2/detail-pages branch only, or should I also compare it with other branches (e.g. main or development)?
    - Yes, limited to revert-2/detail-pages branch.
Is the codebase currently using CommonJS, ESM, or a mix?
    - Mix
Do you want the recommendations as inline PR comments, a written report, or both?
    - A written report would be good for now and let's discuss first before creating the PRs.
Should I implement code changes (e.g. mock setup files, test refactors), or just outline what should be done?
    - Outline what needs to be done providing sample code snippets where you think would be beneficial to the reader
ChatGPT said:
Thanks for confirming. I’ll now analyze the test setup on the revert-2/detail-pages branch of your repository. I’ll produce a detailed written report outlining a future-proof testing strategy that avoids unstable features, with a focus on refactoring tests that rely on Sanity, MongoDB (Mongoose), and Redis first. UI component tests will be prioritized next, followed by general testing recommendations.

I’ll also include relevant code snippets to illustrate the proposed changes. I’ll let you know when the report is ready for your review.

Research completed in 10m · 27 sources · 13 searches
ChatGPT said:
Your detailed analysis and recommendations report on the testing strategy for the revert-2/detail-pages branch is ready. Take a look whenever you’re ready!


Open report
You said:
Branch: revert-2/detail-pages

For each of the four refactoring steps (the provided recommendations), provide instructions on the exact refactoring steps including explanations and affected files. 
ChatGPT said:
To tailor the instructions precisely, could you confirm the test runner or tooling you prefer for step 3 (integration tests)? For example, do you want to use Jest for API route integration tests, or would you rather use Playwright or something else?

Also, should the test environment for MongoDB be set up using mongodb-memory-server, or do you prefer using Docker (e.g., a test container spun up during CI)?

You said:
Playwright and mongodb-memory-server
ChatGPT said:
Perfect. I’ll now generate detailed, step-by-step refactoring instructions for each of the four recommendation categories in the revert-2/detail-pages branch. These will include file-level guidance, explanations, and implementation specifics for:

Refactoring tests that interact with Sanity, MongoDB (via Mongoose), and Redis.

Strengthening UI component tests.

Introducing integration tests using Playwright with mongodb-memory-server.

Ensuring test stability and maintainability.

I'll let you know when the full breakdown is ready for review.

Research completed in 15m · 9 sources · 43 searches
ChatGPT said:
Testing Strategy Refactor Plan for revert-2/detail-pages Branch
Below are step-by-step refactoring instructions for each of the four testing strategy improvements. Each section details the required changes, files to modify or create, explanations, code examples, and important considerations (including risks and CI implications). These changes build on earlier recommendations and align with the project’s current setup (Next.js 15, Sanity, MongoDB/Mongoose, Redis, NextAuth, Playwright, Jest, etc.).
## Mock External Services (Sanity, MongoDB, Redis) in Tests
Exact Refactoring Steps:
Identify External Calls in Tests: Review all existing tests (unit and integration) to locate any that directly communicate with external systems – e.g. Sanity CMS queries, MongoDB/Mongoose database calls, or Redis cache operations. Mark these for refactoring so they no longer hit real services.
Add In-Memory MongoDB for Tests: Install and configure mongodb-memory-server to simulate a MongoDB instance in memory. Update the test setup to launch this in-memory MongoDB instead of connecting to the real MongoDB Atlas. For example, add mongodb-memory-server to dev dependencies (npm install --save-dev mongodb-memory-server) and create a test DB handler (e.g. tests/utils/dbHandler.ts) that starts/stops the in-memory server and connects Mongoose to it
dev.to
. Use this handler in any test suites that require database access:
Files to Update/Create: Add a new file like tests/utils/dbHandler.ts (or similar) and update Jest configuration (jest.setup.ts or individual test files) to call the connect/disconnect helpers. Also update package.json devDependencies.
Code Example:
// tests/utils/dbHandler.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongoServer: MongoMemoryServer;

export async function connectInMemoryDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri); // Use default options or project’s Mongoose options
}
export async function disconnectInMemoryDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}
In your Jest global setup (or before each relevant test suite), call connectInMemoryDB(); in global teardown (or after tests), call disconnectInMemoryDB(). This ensures tests use an isolated in-memory MongoDB instance
dev.to
. Also ensure that any code that uses process.env.MONGODB_URI or similar is pointed to the in-memory URI (you can set process.env.MONGODB_URI in the setup code once the memory server provides it).
Mock Redis with a Test Double: Avoid requiring a live Redis server for tests. Use a library like ioredis-mock to emulate Redis operations in memory
. Install it (npm install --save-dev ioredis-mock) and configure Jest to substitute ioredis with this mock:
Files to Update: In your Jest setup file (e.g. jest.setup.ts or a new jest.mockRedis.ts), add:
jest.mock('ioredis', () => require('ioredis-mock'));
This ensures any import Redis from 'ioredis' in the code uses the in-memory mock instead
. If the project uses a different Redis client library, either find a similar mock library or manually stub its methods (e.g. create a fake class with .get, .set methods using an in-memory JS object).
Explanation: ioredis-mock behaves like a real Redis client but keeps data in-memory, so tests can perform redis.set()/get() without a running Redis server
. This prevents network calls and makes tests self-contained. After each test suite, you can flush the in-memory Redis if needed (e.g. afterEach(() => redis.flushall())) to avoid state leakage.
Stub Sanity CMS Client: Refactor tests (and potentially application code) so that Sanity API calls are not made to the live Sanity backend. Use a test double or Jest mock for the Sanity client:
Implementation: If your code uses the Sanity JS client (e.g. @sanity/client or the generated SDK), create a manual mock. For example, in a __mocks__ directory or in the Jest setup, add:
jest.mock('@sanity/client', () => {
  return () => ({
    fetch: jest.fn((query, params) => Promise.resolve([])), // return empty or dummy data
    create: jest.fn(() => Promise.resolve(/* ... */)),
    // ... stub any other methods used in tests
  });
});
Alternatively, if the project wraps Sanity in a utility module (e.g. lib/sanity.ts that exports a configured client), mock that module instead (e.g. jest.mock('../lib/sanity')). Ensure the mock returns realistic dummy data structures (e.g. arrays of listings or expected objects) so that components/service logic can operate on them in tests.
Files to Update/Create: Possibly create __mocks__/@sanity/client.js (Jest will auto-use it when that module is imported in tests), or update jest.setup.ts to include the above jest.mock for Sanity. Update any tests that were directly calling Sanity to remove network calls and instead rely on the mocked data (you can pre-set the mock’s return values per test if needed using mockImplementationOnce).
Remove Direct Third-Party Integration in Tests: With the above in place, refactor the test code itself:
For tests that previously connected to MongoDB via Mongoose, remove any hard-coded connection strings or external config. Instead, ensure they call connectInMemoryDB() (or that the global setup did so) before exercising any database code. For example, in a Jest beforeAll, connect to the in-memory DB, and perhaps seed initial data as needed (insert test documents via Mongoose models).
For tests using Redis, remove any dependency on a running Redis instance (no more real Redis.connect() calls). The ioredis-mock substitution means new Redis() in code will just create an in-memory store. Verify that in tests by, for instance, asserting that Redis calls return expected values from the mock.
For Sanity, ensure tests do not call the real API. If any test was calling client.fetch with real IDs, adjust it to rely on the mocked return (and possibly set up the mock to return a specific value for that query using mockResolvedValueOnce in the test).
Files to Update: All test files that previously hit real services (e.g. tests for data fetching functions, Next.js API route tests, etc.) should be updated to assume an isolated environment. For example, if there is a test for getListingById that used a real DB ID, instead insert a fake listing into the in-memory DB and call the function, or stub getListingById itself if it was hitting Sanity.
Explanation of Changes: By introducing these mocks and in-memory services, we decouple tests from external dependencies. This makes the test suite faster and more reliable. The MongoDB Memory Server provides a real MongoDB process that runs locally in RAM for the duration of the tests
dev.to
, so Mongoose operations behave as they would with a real database, but with no network latency or persistent side effects. Similarly, ioredis-mock provides an in-memory Redis replacement so cache logic can be tested without an actual Redis server
. Sanity calls are replaced by predictable stubbed functions, avoiding external HTTP calls and allowing us to simulate various responses (empty data, specific query results, etc.). All of these changes improve isolation: tests focus on our code’s logic rather than the availability or correctness of external systems. Risks & Gotchas:
Data Consistency: Ensure the fake data returned by mocks is representative of real data formats. If the app expects certain fields from Sanity or specific Mongo schemas, the test data should include those. Otherwise, you might miss bugs or get false test passes.
Maintenance of Mocks: Keep the mocks updated if external APIs change. For example, if you start using a new Sanity method (like client.delete), update the mock to handle it or tests may crash. It’s wise to centralize these mocks (e.g. one place in the setup) for easy upkeep.
Performance: The in-memory MongoDB does consume resources. Use global setup/teardown to start one instance for a test suite rather than starting/stopping for every single test case to reduce overhead. You can run tests with --runInBand if there are issues with concurrent memory server instances (to avoid spawning multiple MongoDBs at once)
dev.to
. Monitor test runtime in CI; if it becomes slow, consider spinning up the in-memory DB once per suite or globally.
CI Considerations: The mongodb-memory-server will download a MongoDB binary on its first run. In CI, this can add time – you might cache the downloaded binary between runs (it’s usually stored under node_modules/.cache/mongodb-memory-server). Ensure the CI has internet access to fetch it, or pre-package the binary. Also, make sure to use a stable version of mongodb-memory-server (avoid betas) for long-term support. For Redis, using ioredis-mock removes the need to configure a Redis service in CI, simplifying setup.
No Real Calls: After refactoring, run the test suite with network access disabled (if possible) to ensure no test still tries to reach out (e.g. to Sanity or MongoDB Atlas). Any failures indicate a missed mock. Consistently using the mocks will eliminate flakiness due to network issues or API rate limits.
By completing this step, all tests should run purely locally using in-memory or mocked substitutes for Sanity, MongoDB, and Redis. This lays the groundwork for more robust unit and integration tests.


## 2. Strengthen UI Component Tests with Jest & React Testing Library
Exact Refactoring Steps:
Audit Existing Component Tests: Identify which UI components currently have tests and which don’t. Prioritize critical components (e.g. search bar, listing cards, navigation, forms, etc.) for improved coverage. Also note any complex components (using maps, modals, etc.) that may need special handling in tests.
Install/Verify Testing Library Setup: Ensure React Testing Library (RTL) and related packages are installed and configured. This typically includes @testing-library/react, @testing-library/jest-dom, and @testing-library/user-event. If not already present, add them to dev dependencies. Update the Jest config to use the jsdom test environment (since these are browser-like tests). For example, in jest.config.js set "testEnvironment": "jsdom", and include setupFilesAfterEnv: ['<rootDir>/jest.setup.js'] if not already configured
javascript.plainenglish.io
javascript.plainenglish.io
. In jest.setup.js, import '@testing-library/jest-dom/extend-expect' to get helpful matchers.
Write/Refactor Tests for Each Key Component: For each UI component (especially those in app-next-directory that render part of the interface), create or update a test file (e.g. ComponentName.test.tsx). Use React Testing Library to render the component and assert on its behavior:
Files to Create/Update: Add new test files under a __tests__ directory or alongside components. For example, app-next-directory/components/ListingCard.test.tsx to test the ListingCard component.
Test Scenarios: Write tests that cover the component’s render output and interactions from a user’s perspective
javascript.plainenglish.io
. For example:
Rendering: Verify the component renders the expected elements and text given a set of props or state. (“It should display the listing title, image, and tags”).
Interactions: Simulate user actions like clicks, typing, or hovering using userEvent. For instance, test that clicking a "Load more" button calls the passed handler, or that typing in a search input updates state.
Edge Cases: Test how the component behaves with missing or extreme prop values (e.g. no data, long text, loading states, error states).
Code Example:
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingCard from "../components/ListingCard";

const sampleListing = { title: "Eco Hotel", city: "Bangkok", rating: 5 /* ...other props */ };

test("renders listing card with title and city", () => {
  render(<ListingCard listing={sampleListing} onClick={jest.fn()} />);
  expect(screen.getByText("Eco Hotel")).toBeInTheDocument();
  expect(screen.getByText("Bangkok")).toBeInTheDocument();
  // e.g., verify rating is displayed as stars, etc.
});

test("calls onClick handler when card is clicked", async () => {
  const handleClick = jest.fn();
  render(<ListingCard listing={sampleListing} onClick={handleClick} />);
  await userEvent.click(screen.getByRole("button", { name: /open details/i }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
This example uses Testing Library queries to find elements by text or role and simulates a click. It asserts that the component behaves correctly (rendering content, responding to clicks).
Use of Mocks/Stubs: If the component internally uses context providers, Next.js router, or other external hooks, provide mocks. For Next router, you can do:
jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), query: {}, asPath: "/", route: "/" })
}));
so that components using useRouter() don’t fail. If a component uses NextAuth session context, consider wrapping the render in a dummy <SessionProvider> with a fake session value, or mocking the useSession hook similarly.
Repeat for All Target Components: Apply the above pattern to every important UI component. For forms, test form submission flows (fill fields and submit, then assert on results or validation messages). For conditional UI, test both branches (e.g. component shows “No results” message when given empty data). The goal is to cover the expected user interactions and render outcomes for each component, as opposed to testing implementation details.
Leverage Accessibility Queries: When possible, use RTL’s queries by role, label, placeholder, etc., rather than test IDs, to keep tests aligned with actual usage. For example, use screen.getByRole('textbox', { name: /search/i }) for a search input. Only use data-testid selectors as a last resort (for elements with no accessible label or text).
Snapshot or Visual Regression (Optional): For relatively static components (like a pure UI layout), you may add Jest snapshot tests to catch unexpected UI changes. This is optional and should be used sparingly; focus more on interactive tests which provide better coverage of behavior. If using snapshots, commit the snapshot files and update them when intentional changes are made.
Run and Refine: Execute the component test suite and ensure all tests pass. Watch out for issues like “not wrapped in act(...)" warnings, which indicate state updates not handled – fix these by awaiting user events or wrapping updates in act() if needed. Also ensure tests don’t leave timers or async calls hanging (use jest.useFakeTimers() for components with setTimeout, or jest’s waitFor utility to wait for async UI changes).
Explanation of Changes: This step significantly expands front-end test coverage by using Jest + React Testing Library, which encourages testing components in a way that mirrors real user interaction
javascript.plainenglish.io
. Instead of shallowly rendering and checking implementation details, we render components fully and make assertions on what a user would see or do (text content, button clicks, etc.). This ensures our UI components not only render without crashing but also correctly display data and handle user events. Strengthening these tests means future UI refactors or Tailwind/CSS changes can be done with confidence: if a change breaks a key piece of UI or behavior, a test will catch it. Moreover, by using JSDOM and RTL, we avoid needing a browser for these tests – they run quickly in Node, which keeps the feedback loop fast. We also improve maintainability: each component has a dedicated test file, making it clear where to add tests when the component grows. By centralizing common test utilities (like the router or auth context mocks) in the test setup, we avoid duplicating that setup in every file. Risks & Gotchas:
False Sense of Security: Ensure tests are meaningful – e.g., simply checking that a component renders some static text isn’t very useful. Tests should focus on core functionality (what happens when a user interacts? what is displayed given certain props?). Poorly written tests can pass even if the component is broken in real use, so be mindful to cover realistic usage.
Testing Library Async Issues: If a component does asynchronous work (data fetching in useEffect for example), tests need to wait for the result. Use findBy... queries or await waitFor(...) to wait for state updates. Failing to do so can lead to flaky tests or false negatives.
Handling Third-Party UI Components: If some components use third-party modules (maps, charts, etc.), they might not render in JSDOM or might throw errors. You may need to mock those sub-components. For example, if a map component tries to use window.navigator or other browser APIs not present in JSDOM, consider mocking the map component to just render a placeholder in tests. Document these mocks clearly.
CSS and Layout: RTL doesn’t render actual CSS, so we can’t directly test styles or layout (beyond computed style if really needed). Focus on functional behavior. Visual regressions (CSS issues) are better caught with storybook or manual testing, or a dedicated tool, not typical unit tests.
CI Integration: Running these tests in CI is usually straightforward since they are pure Node. Just ensure the CI environment has Chromium etc. if any component test uses something like toBeVisible() (which might rely on computed style; but generally jest-dom handles that without a real browser). Usually no special CI setup is needed aside from running npm test. If memory consumption in CI is a concern (lots of JSDOM instances), you can tweak Jest to run component tests in parallel with a limited number of workers. Also, these tests should be tagged or placed in a way that any watch mode or affected test runs can pick them up (if using Nx or turborepo, ensure the tests are recognized in the pipeline).
By beefing up UI component tests, you reduce the likelihood of front-end regressions and make the codebase friendlier to refactoring (developers can change the UI knowing tests will catch unintended side effects). This complements the back-end and integration tests by focusing on the small-scale behavior of the React components.
3. Introduce Integration Tests with Playwright & In-Memory DB
Exact Refactoring Steps:
Define Key Integration Scenarios: Identify end-to-end user flows or API flows that involve multiple layers of the stack (Next.js API routes, database, and service logic). For example: “Creating a new listing and retrieving it”, “User login and fetching their profile data”, or “Search for a venue and see results”. Prioritize flows that are critical and were not fully covered by unit tests. These will be implemented as Playwright tests to simulate real usage of the application.
Configure Playwright Test Runner: Ensure Playwright is set up in the project (the README mentions Playwright is already configured
GitHub
GitHub
). If not, install it (npm install --save-dev @playwright/test) and create a playwright.config.ts at the root. In the config:
Set the test directory (e.g. tests/playwright or e2e).
Specify the web server to run before tests: use Playwright’s webServer option to spin up the Next.js application in test mode. For example:
// playwright.config.ts snippet
import { PlaywrightTestConfig } from '@playwright/test';
const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run start:test', 
    url: 'http://localhost:3000',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI
  },
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000' }
};
export default config;
Here, npm run start:test should start the Next.js app on port 3000 with the appropriate environment (discussed next), and Playwright will wait up to 60 seconds for it. The baseURL allows tests to use page.goto('/some-path') without specifying the full URL.
Create a test startup script (start:test in package.json): This script should set environment variables for test (like NODE_ENV=test) and launch the Next app. For example, you might add to package.json:
"scripts": {
  "build": "next build",
  "start": "next start",
  "start:test": "next build && NODE_ENV=test MONGODB_URI=\"mongodb://127.0.0.1:27017/test-db\" next start"
}
If using Turborepo, adjust commands accordingly (maybe turbo run build && turbo run start with env). The MONGODB_URI here points to a local Mongo – we will override it to the in-memory server’s URI at runtime. Alternatively, the start:test script can run a custom Node script that programmatically starts the memory server then the Next server (this provides more control; see gotchas below).
Integrate mongodb-memory-server with Playwright: We need the Next app (when started) to use an in-memory DB. There are two approaches:
a) Manual global setup: Write a Playwright globalSetup script (e.g. tests/e2e/globalSetup.ts) that starts mongodb-memory-server, obtains the connection URI, and exports it or sets an env var. The Next app could read this env var when starting. For example, globalSetup can write the URI to an .env.test file or export to process.env.MONGODB_URI before the webServer launches. However, note that Playwright’s webServer will spawn the process separately, so it might not inherit env from globalSetup unless we manage it.
b) Simpler approach: Use a fixed URI for memory server. For example, start the memory server on a known port (like 27017) so that mongodb://127.0.0.1:27017/test-db can be used by the app. You can achieve this by configuring MongoMemoryServer.create({ instance: { port: 27017, dbName: 'test-db' } }). Then start:test can include MONGODB_URI="mongodb://127.0.0.1:27017/test-db". In this approach, you might start the memory server in a separate process or in globalSetup. A straightforward solution is to start the memory server outside of Playwright (e.g. in CI before running tests, launch a background in-memory mongod). But since it’s an in-memory library, a quick solution is to start it within the Next app itself when in test mode:
In-app approach: Modify the DB connection code in the Next.js API (or wherever Mongoose connects) to detect NODE_ENV==='test' and if so, spin up MongoMemoryServer there. This is a bit hacky for production code, but it ensures that when the app starts in test mode, it automatically uses an in-memory DB. A cleaner approach is a small script that starts memory server then launches next start, as mentioned.
Files to Update/Create: Update playwright.config.ts; create tests/e2e/globalSetup.ts if using it; update package.json for start:test; possibly update application DB connection logic to accommodate test DB. Also ensure any config like NextAuth or Sanity in test mode won’t attempt external calls (e.g., you might set env vars like SANITY_DATASET=test and have the Sanity client mock in place as from step 1).
Write Integration Test Cases: Using Playwright’s test syntax, create tests for the chosen scenarios:
Files to Create: e.g. tests/e2e/listingFlow.spec.ts, tests/e2e/authFlow.spec.ts, etc., grouping scenarios logically.
Test Structure: Each test case will typically: (a) set up some known state in the in-memory database (directly via Mongo or via an API call), (b) use Playwright’s page to perform actions or API requests, and (c) assert the outcomes.
Example (UI Flow):
test('User can create a new listing and see it on their dashboard', async ({ page }) => {
  // 1. Log in (simulate user login)
  await page.goto('/login');
  await page.fill('input[name=email]', 'testuser@example.com');
  await page.fill('input[name=password]', 'password123');
  await page.click('button[type=submit]');
  // (Alternatively, bypass UI login by seeding a session cookie if easier)
  // 2. Navigate to New Listing page and fill form
  await page.goto('/listing/new');
  await page.fill('input[name=title]', 'Test EcoCafe');
  // ... fill other fields
  await page.click('text=Submit');  // submit the form
  // 3. Verify via UI that listing appears in dashboard
  await page.goto('/dashboard/my-listings');
  const newListing = await page.waitForSelector('text=Test EcoCafe');
  expect(await newListing?.isVisible()).toBe(true);
});
This test covers a multi-step user interaction flow involving pages, forms, and resulting database updates. Playwright will drive a headless browser to simulate these actions.
Example (API Route Integration): Playwright can also test API routes directly via its request fixture:
test('GET /api/listings returns seeded listings', async ({ request }) => {
  // Seed the database with a listing document (bypassing API, directly in DB or via an API POST if available)
  await seedListing({ title: "Coffee House", city: "Chiang Mai" });
  const response = await request.get('/api/listings?city=Chiang Mai');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toEqual(
    expect.arrayContaining([ expect.objectContaining({ title: "Coffee House" }) ])
  );
});
In this case, seedListing would be a helper that inserts a document into the Mongo memory DB (perhaps using Mongoose models). The test then calls the Next.js API route and checks the JSON output. This ensures that the Next API route, the database, and any service logic (e.g. query building) all work together as expected.
Reuse Test Utilities: If you wrote helpers for seeding data or for common actions (login, etc.), factor those into utility functions (maybe in tests/e2e/utils.ts). For example, a login(page, email, password) helper can be reused across tests to authenticate a user (or you could manipulate cookies/tokens directly for speed, but simulate at least one real login to verify it works).
Use mongodb-memory-server Teardown Between Tests: To keep tests isolated, ensure that each test case starts with a clean database state. Two strategies:
Reset state between tests: After each test, drop the database or collections (since it’s ephemeral, you can drop everything). You might integrate this by calling mongoose.connection.dropDatabase() in an afterEach Playwright fixture or using the globalTeardown to drop at the end if you want each file to start fresh. If tests are totally independent, a full drop in beforeEach of each test file might be simplest (assuming tests run serially or each file runs its own instance).
Dedicated database per test file: Another approach is to use a different DB name for each test suite (if running tests in parallel). mongodb-memory-server can support multiple databases on different ports or the same mongod with different DB names. For simplicity, if you run tests sequentially (Playwright by default runs tests in parallel, but you can tag the heavy integration tests to run serially by setting workers: 1 for that project in config or using test.slow), then one DB reused is fine with resets.
Run Integration Tests Locally: Execute npx playwright test (or via package script) to run the new integration tests. Debug any failures:
If the Next app isn’t starting or connecting to the DB, adjust the startup script or environment. You might need to add some logging in the Next app when in test mode to confirm it connected to the in-memory DB (and not to Atlas).
If tests time out, consider increasing the Playwright timeout (default is 30s per test, which might be okay; the webServer.timeout I set to 60s to allow Next to build/start).
Ensure that the Sanity and Redis integrations are also handled in this environment: e.g., if the pages you test call Sanity, since we mocked Sanity in Jest (unit tests), for Playwright you might need an analogous solution. One option is to run a stub Sanity server or have the Next app detect NODE_ENV=test and bypass Sanity calls (perhaps returning dummy data or reading from a local JSON). This detail depends on how the app is structured. For instance, if the Next API route calls a Sanity client, you could mock that client at the module level in tests by using dependency injection or a build-time flag. The simplest might be to ensure that any required Sanity data is pre-seeded into the Mongo test DB (if you’ve migrated some of that data) or provide a fallback path in test mode.
Explanation of Changes: These integration tests use Playwright to exercise the application in a high-fidelity manner: they start a real Next.js server (just like production, but pointing to our in-memory database and using test config) and interact with it either through the browser (UI clicks and page loads) or HTTP requests. This gives confidence that the entire system works together – from HTTP routing to business logic to database persistence. For instance, testing a Next.js API route with Playwright’s request ensures that the routing, middleware (e.g. auth checks), database queries, and responses are all correct, which unit tests (isolated to one function) might not cover. By including the database (via mongodb-memory-server), we verify the real queries and Mongoose models, catching issues like incorrect schema usage or query filters that return wrong data. Using Playwright as the runner provides a robust environment for these tests. It handles launching browsers for E2E scenarios and can also do API calls. We prefer Playwright here for integration tests (instead of using Jest + Supertest, for example) to stay consistent with the E2E tooling and because Playwright can easily cover both UI and API aspects. Another benefit is Playwright’s tracing and screenshot capabilities, which can help debug failures in CI by examining what the browser saw. By integrating these tests, we achieve coverage on things like:
Does the Next.js application start correctly with our configuration?
Do our API endpoints actually work end-to-end (e.g., the /api/search endpoint returns results when the DB has certain data, etc.)?
Does a full user workflow execute without errors (for example, end-to-end signup or listing creation as shown)?
These are the kinds of issues that unit tests might miss, especially in a complex environment with NextAuth, RBAC, etc. Risks & Gotchas:
Test Flakiness: End-to-end style tests can be flaky if not written carefully. To mitigate this:
Always wait for page events or network responses rather than using fixed delays. Use page.waitForSelector(...) or await expect(element).toBeVisible() to synchronize test actions with app state.
If a test involves time-dependent behavior (like an email verification that comes after 10 seconds), try to shorten or mock that in test. Long sleeps will slow tests; instead simulate or intercept where possible.
Ensure that the app in test mode sends minimal external requests. For example, disable any analytics or third-party calls via env flags. Any network call that isn’t to our app could introduce flakiness if the external service is slow or requires network.
Performance: Running a Next server + browser can be heavy. Tests will be slower than unit tests. Keep the integration test suite targeted – focus on the most important flows. It’s common to have maybe a dozen integration tests covering core scenarios. Don’t try to cover every minor edge case here (that’s what unit tests are for). This keeps runtime reasonable (e.g. a few minutes). In CI, consider running these in a separate job (so that unit tests can still give quick feedback). If using GitHub Actions, you might use the Playwright GH Action which sets up browsers. Also, set CI=true environment so Playwright runs in headless mode and possibly with fewer resources.
CI Configuration: As mentioned, ensure the CI installs Playwright dependencies (e.g., on Linux, Playwright’s npm install usually pulls browser binaries; you might need to run npx playwright install --with-deps on a fresh runner). Also, consider using the reuseExistingServer: !process.env.CI config as above – this lets you locally reuse a running dev server for speed, but always start fresh in CI.
Database State Management: If tests run in parallel, be careful that they don’t interfere via the DB. You might isolate them by using different collections or locking tests to run sequentially. A safer strategy is to run Playwright tests with a single worker (set workers: 1 in the config for the project). This will avoid concurrency issues in the database and also reduce load (since one Next server can handle the sequential tests). It will be slower than parallel, but typically integration tests count is low enough.
NextAuth/Auth flows: Testing authentication flows can be complex. If using NextAuth, you might not want Playwright to actually perform OAuth flows. Instead, you can simulate an authenticated state. For example, if using credentials/email, you did as above by filling the form. If using OAuth, consider seeding a session: you can create a session token in the test DB and set the cookie in the browser context so that the app thinks the user is logged in. Playwright allows setting cookies via context.addCookies(). You’d need to know the cookie format used by NextAuth (e.g. next-auth.session-token). This avoids external login and speeds up tests.
Sanity/External APIs in integration: As noted, ensure that pages or API routes that normally call Sanity (or any external API) are handled. Ideally, by the time you’re at integration testing, most data should come from the local DB or be stubbed. If not, you might use MSW (Mock Service Worker) with Playwright to intercept network calls to Sanity and return dummy data. Playwright can intercept network requests via page.route('https://*.sanity.io/**', route => route.fulfill({ body: JSON.stringify(fakeData) })). This is an advanced usage, but it’s a powerful way to prevent real external calls during the test.
Maintenance: As with any E2E tests, if the UI or API changes (routes, text, etc.), these tests need updating. Try to write them in a resilient way: use getByRole and visible text that’s less likely to change than selectors. But accept that some churn in tests is normal when features change. The confidence they provide is usually worth the maintenance.
By adding these Playwright integration tests, we bolster our test suite to catch issues that occur only when multiple pieces are integrated. This is especially important in a Next.js monorepo with a lot of moving parts (frontend, backend API, database, CMS). It ensures our critical user journeys and API functionalities work as expected in a production-like environment.
4. Improve Test Isolation, Configuration and Maintainability
Exact Refactoring Steps:
Centralize Test Configuration: Consolidate configuration that is common across tests to a single location. For example, use one Jest config (or a base config) for all Jest tests. Ensure all custom setup (like global mocks, extended matchers, etc.) are loaded via jest.setup.ts (already discussed). Similarly, keep Playwright config centralized (playwright.config.ts). This means:
Remove any duplicate or per-test configuration scattered in different files. For instance, if multiple test files manually configure Mongoose or set environment variables, move that to a global setup (for Jest, use setupFiles or setupFilesAfterEnv; for Playwright, use globalSetup or the webServer config as described).
Use shared helpers: Create utility functions for repetitive tasks (e.g. seeding data, logging in users in tests, rendering with providers). Place them in a tests/utils folder so all tests can import them. This avoids each test reinventing the wheel and makes maintenance easier (update in one place).
Files to Update/Create: For Jest – ensure jest.config.js exists at root (if using monorepo, possibly one per package or a root that covers all using projects). Define clear patterns for test files (like **/*.test.ts?(x)) so new tests are picked up. Include the global setup file (for DB or env) and teardown if needed (e.g. to stop any servers or close connections). For Playwright – ensure playwright.config.ts has everything needed (as above).
Consistent Use of Mocks/Stubs: Enforce that all tests use the same strategy for external services to avoid one test accidentally hitting a real service:
Set Jest to fail tests on unmocked network calls if possible. One way is to use jest.spyOn(global, 'fetch') in setup to throw if called, unless tests explicitly mock fetch. This helps catch any test that might try to call external APIs. Alternatively, use the --detectOpenHandles and --forceExit flags (as seen in memory-server guides
dev.to
) to ensure no hanging connections.
Add module name mappers in Jest config to map modules to their mocks. For example, ensure that if code imports a module like @sanity/client, it’s mapped to our mock implementation module by default. In jest.config.js:
moduleNameMapper: {
  '^@sanity/client$': '<rootDir>/tests/__mocks__/sanityClient.js',
  '^ioredis$': 'ioredis-mock',  // ensure ioredis import uses the mock
  // ...other mappings if needed
},
restoreMocks: true,
clearMocks: true,
resetModules: true,
The restoreMocks/clearMocks options make sure that any jest.spyOn or mock state is reset between tests automatically, improving isolation.
Document in a contributing or testing readme that any new external integration should be mocked in tests following these patterns.
Eliminate Test Flakiness: Go through the test suite and fix any nondeterministic behavior:
If some tests rely on timers (like debouncing or async waits), use Jest’s fake timers or explicit waits to control timing. For example, for a debounce hook test, you can jest.useFakeTimers() and advance time to simulate the delay.
Ensure each test has a clean state. For unit tests with in-memory DB, call disconnectInMemoryDB() and reconnect between suites or use fresh MongoMemoryServer instances as needed. For integration, as discussed, clear DB state between tests.
If tests shared some singleton state (e.g. a singleton Mongoose connection or a cached value), use jest.resetModules() (enabled by config as above) to isolate module instances per test file. This prevents cross-test pollution where one test could, for instance, modify a global variable that another test reads.
Randomize test order (optional): Jest has --shuffle (or use a third-party) to run tests in random order on CI occasionally – this can help detect hidden dependencies between tests. If discovered, refactor tests to remove those couplings.
Run tests in CI with sufficient retries if a particular test is flaky due to external conditions. Playwright supports a retries option in config for CI runs (e.g. retries: 1 to retry once if fail). This should not be a crutch – fix root causes of flakiness – but a mild retry can handle rare timing issues.
Maintainability Enhancements:
Simplify Test Data Management: If many tests use similar data setup, consider creating factory functions or JSON fixtures. For example, a makeListing(overrides) function to generate listing objects with default fields can reduce repetition and make tests clearer. Store these in a tests/factories/ module.
Test Naming and Organization: Make sure test files and test cases have descriptive names. This helps when reading test outputs. Organize tests in folders (unit tests in one folder, integration in another) or use naming conventions so it’s clear which are which (some projects suffix integration tests differently or put them under e2e/). This clarity helps new contributors run or focus on relevant tests.
Continuous Integration Settings: Update CI config (e.g., GitHub Actions workflows) to run the tests with the new structure. Possibly split jobs: run unit tests (Jest) and integration tests (Playwright) separately. This can improve feedback time and allow using different machine needs (Playwright might need a bigger container or Xvfb for browsers). Also, add caching for dependencies and the MongoDB binary as mentioned.
Remove Flaky Tests or Quarantining: If after all fixes, a test is still flaky and not essential, consider temporarily quarantining it (skip in CI) with a test.skip and an associated TODO to fix. This prevents random CI failures blocking merges. But aim to have zero skipped tests long-term.
Regularly Review and Update: Mark this step as ongoing: as the project evolves, periodically revisit the test configs and mocks. For instance, if Next.js introduces a new testing utility or if any of the libraries deprecate something (like mongodb-memory-server v8 might change API), update accordingly. Keeping the testing tools up-to-date is part of maintainability.
Explanation of Changes: This final set of changes is about polishing the testing system to be robust and easy to work with. By centralizing configuration, we reduce duplication and the chance of inconsistency. For example, if all tests go through one config, you won’t have one suite using a different timeout or a different mock setup than another – everything uses the same base, so behavior is uniform. This also makes updates easier: if we decide to change a library (say, swap out mongodb-memory-server for another solution), we change it in one place. Test isolation improvements ensure that tests don’t impact each other. This is crucial when tests run in random order or in parallel. Each test should be able to run independently of others and on any machine with the same results. Achieving this often means cleaning up side effects (e.g., no leftover DB entries, no global variables modified, no unmocked network calls that might pass or fail depending on network). We’ve put measures in place for each of these – clearing databases, using restoreMocks, and so on. By using stable libraries and proven patterns (no experimental Node APIs or unstable Next features for testing), we prioritize long-term maintainability. For instance, using Playwright (a well-supported project) and Jest (widely used) means we get community support and updates. We avoid hacks like manually tweaking Next internals or using unofficial plugins, which might break on upgrade. This conservative approach in testing is beneficial since tests are our safety net – we want them to be rock solid. Risks & Gotchas:
Initial Setup Effort: There is upfront work to reorganize tests and configs, which might temporarily cause some test failures if something is missed. It’s important to run tests frequently while refactoring to catch issues (e.g., if a global mock wasn’t applied and a test suddenly starts calling real API).
Learning Curve: Team members need to get acquainted with the new testing approach. Provide documentation – for example, update docs/DEVELOPMENT_GUIDE.md or create a docs/TESTING_GUIDE.md explaining how to run tests, how to write new tests with mocks, and examples of the patterns. This will help maintain consistency as new tests are written.
CI Timing: Integration tests will lengthen the CI run. Monitor if this is acceptable (perhaps the total build+test time is still okay). If not, consider running some tests nightly or reviewing if any tests can be slimmed down. However, given the scope, it should be manageable.
Environment Parity: Because we use NODE_ENV=test configuration, ensure that this doesn’t accidentally bypass important logic. For example, if in code there’s if (process.env.NODE_ENV !== 'production') { /* skip auth */ }, tests might pass but production would enforce auth. We should strive to keep behavior in test as close to real as possible, only stubbing external dependencies. So be cautious with any test-specific branches in code – use them only for truly external interactions, not core logic.
Dependency Version Locking: To avoid surprises, lock versions of test libs in package.json (or use a lockfile). A sudden major update to something like Testing Library or Playwright could change behaviors. Regularly update these intentionally and adjust tests if needed.
Mocks Consistency: If multiple mocks are nested, be careful about their order. For instance, if a Sanity client is used inside a function that’s mocked, ensure the client itself is mocked at the right level. In general, prefer higher-level mocks (mock the module providing data rather than deep internals). This reduces how many places need updating when something changes.
By implementing all the above, the test suite will be faster, more reliable, and easier to work with. Developers can run unit tests quickly for rapid feedback, and the CI can run the full suite (unit + component + integration) to catch any regressions. Tests will be less flaky, so a red build truly means something is wrong with the code, not the tests. Overall, these refactors will support the long-term health of the project by ensuring new features and changes can be verified with confidence. Each improvement – from mocking external services to comprehensive UI tests to end-to-end verifications – adds layers to a balanced testing strategy that will accompany the project as it grows.



Testing Strategy Refactor Plan for revert-2/detail-pages Branch
Below are step-by-step refactoring instructions for each of the four testing strategy improvements. Each section details the required changes, files to modify or create, explanations, code examples, and important considerations (including risks and CI implications). These changes build on earlier recommendations and align with the project’s current setup (Next.js 15, Sanity, MongoDB/Mongoose, Redis, NextAuth, Playwright, Jest, etc.).
1. Mock External Services (Sanity, MongoDB, Redis) in Tests
Exact Refactoring Steps:
Identify External Calls in Tests: Review all existing tests (unit and integration) to locate any that directly communicate with external systems – e.g. Sanity CMS queries, MongoDB/Mongoose database calls, or Redis cache operations. Mark these for refactoring so they no longer hit real services.
Add In-Memory MongoDB for Tests: Install and configure mongodb-memory-server to simulate a MongoDB instance in memory. Update the test setup to launch this in-memory MongoDB instead of connecting to the real MongoDB Atlas. For example, add mongodb-memory-server to dev dependencies (npm install --save-dev mongodb-memory-server) and create a test DB handler (e.g. tests/utils/dbHandler.ts) that starts/stops the in-memory server and connects Mongoose to it
dev.to
. Use this handler in any test suites that require database access:
Files to Update/Create: Add a new file like tests/utils/dbHandler.ts (or similar) and update Jest configuration (jest.setup.ts or individual test files) to call the connect/disconnect helpers. Also update package.json devDependencies.
Code Example:
// tests/utils/dbHandler.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongoServer: MongoMemoryServer;

export async function connectInMemoryDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri); // Use default options or project’s Mongoose options
}
export async function disconnectInMemoryDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}
In your Jest global setup (or before each relevant test suite), call connectInMemoryDB(); in global teardown (or after tests), call disconnectInMemoryDB(). This ensures tests use an isolated in-memory MongoDB instance
dev.to
. Also ensure that any code that uses process.env.MONGODB_URI or similar is pointed to the in-memory URI (you can set process.env.MONGODB_URI in the setup code once the memory server provides it).
Mock Redis with a Test Double: Avoid requiring a live Redis server for tests. Use a library like ioredis-mock to emulate Redis operations in memory
. Install it (npm install --save-dev ioredis-mock) and configure Jest to substitute ioredis with this mock:
Files to Update: In your Jest setup file (e.g. jest.setup.ts or a new jest.mockRedis.ts), add:
jest.mock('ioredis', () => require('ioredis-mock'));
This ensures any import Redis from 'ioredis' in the code uses the in-memory mock instead
. If the project uses a different Redis client library, either find a similar mock library or manually stub its methods (e.g. create a fake class with .get, .set methods using an in-memory JS object).
Explanation: ioredis-mock behaves like a real Redis client but keeps data in-memory, so tests can perform redis.set()/get() without a running Redis server
. This prevents network calls and makes tests self-contained. After each test suite, you can flush the in-memory Redis if needed (e.g. afterEach(() => redis.flushall())) to avoid state leakage.
Stub Sanity CMS Client: Refactor tests (and potentially application code) so that Sanity API calls are not made to the live Sanity backend. Use a test double or Jest mock for the Sanity client:
Implementation: If your code uses the Sanity JS client (e.g. @sanity/client or the generated SDK), create a manual mock. For example, in a __mocks__ directory or in the Jest setup, add:
jest.mock('@sanity/client', () => {
  return () => ({
    fetch: jest.fn((query, params) => Promise.resolve([])), // return empty or dummy data
    create: jest.fn(() => Promise.resolve(/* ... */)),
    // ... stub any other methods used in tests
  });
});
Alternatively, if the project wraps Sanity in a utility module (e.g. lib/sanity.ts that exports a configured client), mock that module instead (e.g. jest.mock('../lib/sanity')). Ensure the mock returns realistic dummy data structures (e.g. arrays of listings or expected objects) so that components/service logic can operate on them in tests.
Files to Update/Create: Possibly create __mocks__/@sanity/client.js (Jest will auto-use it when that module is imported in tests), or update jest.setup.ts to include the above jest.mock for Sanity. Update any tests that were directly calling Sanity to remove network calls and instead rely on the mocked data (you can pre-set the mock’s return values per test if needed using mockImplementationOnce).
Remove Direct Third-Party Integration in Tests: With the above in place, refactor the test code itself:
For tests that previously connected to MongoDB via Mongoose, remove any hard-coded connection strings or external config. Instead, ensure they call connectInMemoryDB() (or that the global setup did so) before exercising any database code. For example, in a Jest beforeAll, connect to the in-memory DB, and perhaps seed initial data as needed (insert test documents via Mongoose models).
For tests using Redis, remove any dependency on a running Redis instance (no more real Redis.connect() calls). The ioredis-mock substitution means new Redis() in code will just create an in-memory store. Verify that in tests by, for instance, asserting that Redis calls return expected values from the mock.
For Sanity, ensure tests do not call the real API. If any test was calling client.fetch with real IDs, adjust it to rely on the mocked return (and possibly set up the mock to return a specific value for that query using mockResolvedValueOnce in the test).
Files to Update: All test files that previously hit real services (e.g. tests for data fetching functions, Next.js API route tests, etc.) should be updated to assume an isolated environment. For example, if there is a test for getListingById that used a real DB ID, instead insert a fake listing into the in-memory DB and call the function, or stub getListingById itself if it was hitting Sanity.
Explanation of Changes: By introducing these mocks and in-memory services, we decouple tests from external dependencies. This makes the test suite faster and more reliable. The MongoDB Memory Server provides a real MongoDB process that runs locally in RAM for the duration of the tests
dev.to
, so Mongoose operations behave as they would with a real database, but with no network latency or persistent side effects. Similarly, ioredis-mock provides an in-memory Redis replacement so cache logic can be tested without an actual Redis server
. Sanity calls are replaced by predictable stubbed functions, avoiding external HTTP calls and allowing us to simulate various responses (empty data, specific query results, etc.). All of these changes improve isolation: tests focus on our code’s logic rather than the availability or correctness of external systems. Risks & Gotchas:
Data Consistency: Ensure the fake data returned by mocks is representative of real data formats. If the app expects certain fields from Sanity or specific Mongo schemas, the test data should include those. Otherwise, you might miss bugs or get false test passes.
Maintenance of Mocks: Keep the mocks updated if external APIs change. For example, if you start using a new Sanity method (like client.delete), update the mock to handle it or tests may crash. It’s wise to centralize these mocks (e.g. one place in the setup) for easy upkeep.
Performance: The in-memory MongoDB does consume resources. Use global setup/teardown to start one instance for a test suite rather than starting/stopping for every single test case to reduce overhead. You can run tests with --runInBand if there are issues with concurrent memory server instances (to avoid spawning multiple MongoDBs at once)
dev.to
. Monitor test runtime in CI; if it becomes slow, consider spinning up the in-memory DB once per suite or globally.
CI Considerations: The mongodb-memory-server will download a MongoDB binary on its first run. In CI, this can add time – you might cache the downloaded binary between runs (it’s usually stored under node_modules/.cache/mongodb-memory-server). Ensure the CI has internet access to fetch it, or pre-package the binary. Also, make sure to use a stable version of mongodb-memory-server (avoid betas) for long-term support. For Redis, using ioredis-mock removes the need to configure a Redis service in CI, simplifying setup.
No Real Calls: After refactoring, run the test suite with network access disabled (if possible) to ensure no test still tries to reach out (e.g. to Sanity or MongoDB Atlas). Any failures indicate a missed mock. Consistently using the mocks will eliminate flakiness due to network issues or API rate limits.
By completing this step, all tests should run purely locally using in-memory or mocked substitutes for Sanity, MongoDB, and Redis. This lays the groundwork for more robust unit and integration tests.
2. Strengthen UI Component Tests with Jest & React Testing Library
Exact Refactoring Steps:
Audit Existing Component Tests: Identify which UI components currently have tests and which don’t. Prioritize critical components (e.g. search bar, listing cards, navigation, forms, etc.) for improved coverage. Also note any complex components (using maps, modals, etc.) that may need special handling in tests.
Install/Verify Testing Library Setup: Ensure React Testing Library (RTL) and related packages are installed and configured. This typically includes @testing-library/react, @testing-library/jest-dom, and @testing-library/user-event. If not already present, add them to dev dependencies. Update the Jest config to use the jsdom test environment (since these are browser-like tests). For example, in jest.config.js set "testEnvironment": "jsdom", and include setupFilesAfterEnv: ['<rootDir>/jest.setup.js'] if not already configured
javascript.plainenglish.io
javascript.plainenglish.io
. In jest.setup.js, import '@testing-library/jest-dom/extend-expect' to get helpful matchers.
Write/Refactor Tests for Each Key Component: For each UI component (especially those in app-next-directory that render part of the interface), create or update a test file (e.g. ComponentName.test.tsx). Use React Testing Library to render the component and assert on its behavior:
Files to Create/Update: Add new test files under a __tests__ directory or alongside components. For example, app-next-directory/components/ListingCard.test.tsx to test the ListingCard component.
Test Scenarios: Write tests that cover the component’s render output and interactions from a user’s perspective
javascript.plainenglish.io
. For example:
Rendering: Verify the component renders the expected elements and text given a set of props or state. (“It should display the listing title, image, and tags”).
Interactions: Simulate user actions like clicks, typing, or hovering using userEvent. For instance, test that clicking a "Load more" button calls the passed handler, or that typing in a search input updates state.
Edge Cases: Test how the component behaves with missing or extreme prop values (e.g. no data, long text, loading states, error states).
Code Example:
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingCard from "../components/ListingCard";

const sampleListing = { title: "Eco Hotel", city: "Bangkok", rating: 5 /* ...other props */ };

test("renders listing card with title and city", () => {
  render(<ListingCard listing={sampleListing} onClick={jest.fn()} />);
  expect(screen.getByText("Eco Hotel")).toBeInTheDocument();
  expect(screen.getByText("Bangkok")).toBeInTheDocument();
  // e.g., verify rating is displayed as stars, etc.
});

test("calls onClick handler when card is clicked", async () => {
  const handleClick = jest.fn();
  render(<ListingCard listing={sampleListing} onClick={handleClick} />);
  await userEvent.click(screen.getByRole("button", { name: /open details/i }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
This example uses Testing Library queries to find elements by text or role and simulates a click. It asserts that the component behaves correctly (rendering content, responding to clicks).
Use of Mocks/Stubs: If the component internally uses context providers, Next.js router, or other external hooks, provide mocks. For Next router, you can do:
jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), query: {}, asPath: "/", route: "/" })
}));
so that components using useRouter() don’t fail. If a component uses NextAuth session context, consider wrapping the render in a dummy <SessionProvider> with a fake session value, or mocking the useSession hook similarly.
Repeat for All Target Components: Apply the above pattern to every important UI component. For forms, test form submission flows (fill fields and submit, then assert on results or validation messages). For conditional UI, test both branches (e.g. component shows “No results” message when given empty data). The goal is to cover the expected user interactions and render outcomes for each component, as opposed to testing implementation details.
Leverage Accessibility Queries: When possible, use RTL’s queries by role, label, placeholder, etc., rather than test IDs, to keep tests aligned with actual usage. For example, use screen.getByRole('textbox', { name: /search/i }) for a search input. Only use data-testid selectors as a last resort (for elements with no accessible label or text).
Snapshot or Visual Regression (Optional): For relatively static components (like a pure UI layout), you may add Jest snapshot tests to catch unexpected UI changes. This is optional and should be used sparingly; focus more on interactive tests which provide better coverage of behavior. If using snapshots, commit the snapshot files and update them when intentional changes are made.
Run and Refine: Execute the component test suite and ensure all tests pass. Watch out for issues like “not wrapped in act(...)" warnings, which indicate state updates not handled – fix these by awaiting user events or wrapping updates in act() if needed. Also ensure tests don’t leave timers or async calls hanging (use jest.useFakeTimers() for components with setTimeout, or jest’s waitFor utility to wait for async UI changes).
Explanation of Changes: This step significantly expands front-end test coverage by using Jest + React Testing Library, which encourages testing components in a way that mirrors real user interaction
javascript.plainenglish.io
. Instead of shallowly rendering and checking implementation details, we render components fully and make assertions on what a user would see or do (text content, button clicks, etc.). This ensures our UI components not only render without crashing but also correctly display data and handle user events. Strengthening these tests means future UI refactors or Tailwind/CSS changes can be done with confidence: if a change breaks a key piece of UI or behavior, a test will catch it. Moreover, by using JSDOM and RTL, we avoid needing a browser for these tests – they run quickly in Node, which keeps the feedback loop fast. We also improve maintainability: each component has a dedicated test file, making it clear where to add tests when the component grows. By centralizing common test utilities (like the router or auth context mocks) in the test setup, we avoid duplicating that setup in every file. Risks & Gotchas:
False Sense of Security: Ensure tests are meaningful – e.g., simply checking that a component renders some static text isn’t very useful. Tests should focus on core functionality (what happens when a user interacts? what is displayed given certain props?). Poorly written tests can pass even if the component is broken in real use, so be mindful to cover realistic usage.
Testing Library Async Issues: If a component does asynchronous work (data fetching in useEffect for example), tests need to wait for the result. Use findBy... queries or await waitFor(...) to wait for state updates. Failing to do so can lead to flaky tests or false negatives.
Handling Third-Party UI Components: If some components use third-party modules (maps, charts, etc.), they might not render in JSDOM or might throw errors. You may need to mock those sub-components. For example, if a map component tries to use window.navigator or other browser APIs not present in JSDOM, consider mocking the map component to just render a placeholder in tests. Document these mocks clearly.
CSS and Layout: RTL doesn’t render actual CSS, so we can’t directly test styles or layout (beyond computed style if really needed). Focus on functional behavior. Visual regressions (CSS issues) are better caught with storybook or manual testing, or a dedicated tool, not typical unit tests.
CI Integration: Running these tests in CI is usually straightforward since they are pure Node. Just ensure the CI environment has Chromium etc. if any component test uses something like toBeVisible() (which might rely on computed style; but generally jest-dom handles that without a real browser). Usually no special CI setup is needed aside from running npm test. If memory consumption in CI is a concern (lots of JSDOM instances), you can tweak Jest to run component tests in parallel with a limited number of workers. Also, these tests should be tagged or placed in a way that any watch mode or affected test runs can pick them up (if using Nx or turborepo, ensure the tests are recognized in the pipeline).
By beefing up UI component tests, you reduce the likelihood of front-end regressions and make the codebase friendlier to refactoring (developers can change the UI knowing tests will catch unintended side effects). This complements the back-end and integration tests by focusing on the small-scale behavior of the React components.
3. Introduce Integration Tests with Playwright & In-Memory DB
Exact Refactoring Steps:
Define Key Integration Scenarios: Identify end-to-end user flows or API flows that involve multiple layers of the stack (Next.js API routes, database, and service logic). For example: “Creating a new listing and retrieving it”, “User login and fetching their profile data”, or “Search for a venue and see results”. Prioritize flows that are critical and were not fully covered by unit tests. These will be implemented as Playwright tests to simulate real usage of the application.
Configure Playwright Test Runner: Ensure Playwright is set up in the project (the README mentions Playwright is already configured
GitHub
GitHub
). If not, install it (npm install --save-dev @playwright/test) and create a playwright.config.ts at the root. In the config:
Set the test directory (e.g. tests/playwright or e2e).
Specify the web server to run before tests: use Playwright’s webServer option to spin up the Next.js application in test mode. For example:
// playwright.config.ts snippet
import { PlaywrightTestConfig } from '@playwright/test';
const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run start:test', 
    url: 'http://localhost:3000',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI
  },
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000' }
};
export default config;
Here, npm run start:test should start the Next.js app on port 3000 with the appropriate environment (discussed next), and Playwright will wait up to 60 seconds for it. The baseURL allows tests to use page.goto('/some-path') without specifying the full URL.
Create a test startup script (start:test in package.json): This script should set environment variables for test (like NODE_ENV=test) and launch the Next app. For example, you might add to package.json:
"scripts": {
  "build": "next build",
  "start": "next start",
  "start:test": "next build && NODE_ENV=test MONGODB_URI=\"mongodb://127.0.0.1:27017/test-db\" next start"
}
If using Turborepo, adjust commands accordingly (maybe turbo run build && turbo run start with env). The MONGODB_URI here points to a local Mongo – we will override it to the in-memory server’s URI at runtime. Alternatively, the start:test script can run a custom Node script that programmatically starts the memory server then the Next server (this provides more control; see gotchas below).
Integrate mongodb-memory-server with Playwright: We need the Next app (when started) to use an in-memory DB. There are two approaches:
a) Manual global setup: Write a Playwright globalSetup script (e.g. tests/e2e/globalSetup.ts) that starts mongodb-memory-server, obtains the connection URI, and exports it or sets an env var. The Next app could read this env var when starting. For example, globalSetup can write the URI to an .env.test file or export to process.env.MONGODB_URI before the webServer launches. However, note that Playwright’s webServer will spawn the process separately, so it might not inherit env from globalSetup unless we manage it.
b) Simpler approach: Use a fixed URI for memory server. For example, start the memory server on a known port (like 27017) so that mongodb://127.0.0.1:27017/test-db can be used by the app. You can achieve this by configuring MongoMemoryServer.create({ instance: { port: 27017, dbName: 'test-db' } }). Then start:test can include MONGODB_URI="mongodb://127.0.0.1:27017/test-db". In this approach, you might start the memory server in a separate process or in globalSetup. A straightforward solution is to start the memory server outside of Playwright (e.g. in CI before running tests, launch a background in-memory mongod). But since it’s an in-memory library, a quick solution is to start it within the Next app itself when in test mode:
In-app approach: Modify the DB connection code in the Next.js API (or wherever Mongoose connects) to detect NODE_ENV==='test' and if so, spin up MongoMemoryServer there. This is a bit hacky for production code, but it ensures that when the app starts in test mode, it automatically uses an in-memory DB. A cleaner approach is a small script that starts memory server then launches next start, as mentioned.
Files to Update/Create: Update playwright.config.ts; create tests/e2e/globalSetup.ts if using it; update package.json for start:test; possibly update application DB connection logic to accommodate test DB. Also ensure any config like NextAuth or Sanity in test mode won’t attempt external calls (e.g., you might set env vars like SANITY_DATASET=test and have the Sanity client mock in place as from step 1).
Write Integration Test Cases: Using Playwright’s test syntax, create tests for the chosen scenarios:
Files to Create: e.g. tests/e2e/listingFlow.spec.ts, tests/e2e/authFlow.spec.ts, etc., grouping scenarios logically.
Test Structure: Each test case will typically: (a) set up some known state in the in-memory database (directly via Mongo or via an API call), (b) use Playwright’s page to perform actions or API requests, and (c) assert the outcomes.
Example (UI Flow):
test('User can create a new listing and see it on their dashboard', async ({ page }) => {
  // 1. Log in (simulate user login)
  await page.goto('/login');
  await page.fill('input[name=email]', 'testuser@example.com');
  await page.fill('input[name=password]', 'password123');
  await page.click('button[type=submit]');
  // (Alternatively, bypass UI login by seeding a session cookie if easier)
  // 2. Navigate to New Listing page and fill form
  await page.goto('/listing/new');
  await page.fill('input[name=title]', 'Test EcoCafe');
  // ... fill other fields
  await page.click('text=Submit');  // submit the form
  // 3. Verify via UI that listing appears in dashboard
  await page.goto('/dashboard/my-listings');
  const newListing = await page.waitForSelector('text=Test EcoCafe');
  expect(await newListing?.isVisible()).toBe(true);
});
This test covers a multi-step user interaction flow involving pages, forms, and resulting database updates. Playwright will drive a headless browser to simulate these actions.
Example (API Route Integration): Playwright can also test API routes directly via its request fixture:
test('GET /api/listings returns seeded listings', async ({ request }) => {
  // Seed the database with a listing document (bypassing API, directly in DB or via an API POST if available)
  await seedListing({ title: "Coffee House", city: "Chiang Mai" });
  const response = await request.get('/api/listings?city=Chiang Mai');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toEqual(
    expect.arrayContaining([ expect.objectContaining({ title: "Coffee House" }) ])
  );
});
In this case, seedListing would be a helper that inserts a document into the Mongo memory DB (perhaps using Mongoose models). The test then calls the Next.js API route and checks the JSON output. This ensures that the Next API route, the database, and any service logic (e.g. query building) all work together as expected.
Reuse Test Utilities: If you wrote helpers for seeding data or for common actions (login, etc.), factor those into utility functions (maybe in tests/e2e/utils.ts). For example, a login(page, email, password) helper can be reused across tests to authenticate a user (or you could manipulate cookies/tokens directly for speed, but simulate at least one real login to verify it works).
Use mongodb-memory-server Teardown Between Tests: To keep tests isolated, ensure that each test case starts with a clean database state. Two strategies:
Reset state between tests: After each test, drop the database or collections (since it’s ephemeral, you can drop everything). You might integrate this by calling mongoose.connection.dropDatabase() in an afterEach Playwright fixture or using the globalTeardown to drop at the end if you want each file to start fresh. If tests are totally independent, a full drop in beforeEach of each test file might be simplest (assuming tests run serially or each file runs its own instance).
Dedicated database per test file: Another approach is to use a different DB name for each test suite (if running tests in parallel). mongodb-memory-server can support multiple databases on different ports or the same mongod with different DB names. For simplicity, if you run tests sequentially (Playwright by default runs tests in parallel, but you can tag the heavy integration tests to run serially by setting workers: 1 for that project in config or using test.slow), then one DB reused is fine with resets.
Run Integration Tests Locally: Execute npx playwright test (or via package script) to run the new integration tests. Debug any failures:
If the Next app isn’t starting or connecting to the DB, adjust the startup script or environment. You might need to add some logging in the Next app when in test mode to confirm it connected to the in-memory DB (and not to Atlas).
If tests time out, consider increasing the Playwright timeout (default is 30s per test, which might be okay; the webServer.timeout I set to 60s to allow Next to build/start).
Ensure that the Sanity and Redis integrations are also handled in this environment: e.g., if the pages you test call Sanity, since we mocked Sanity in Jest (unit tests), for Playwright you might need an analogous solution. One option is to run a stub Sanity server or have the Next app detect NODE_ENV=test and bypass Sanity calls (perhaps returning dummy data or reading from a local JSON). This detail depends on how the app is structured. For instance, if the Next API route calls a Sanity client, you could mock that client at the module level in tests by using dependency injection or a build-time flag. The simplest might be to ensure that any required Sanity data is pre-seeded into the Mongo test DB (if you’ve migrated some of that data) or provide a fallback path in test mode.
Explanation of Changes: These integration tests use Playwright to exercise the application in a high-fidelity manner: they start a real Next.js server (just like production, but pointing to our in-memory database and using test config) and interact with it either through the browser (UI clicks and page loads) or HTTP requests. This gives confidence that the entire system works together – from HTTP routing to business logic to database persistence. For instance, testing a Next.js API route with Playwright’s request ensures that the routing, middleware (e.g. auth checks), database queries, and responses are all correct, which unit tests (isolated to one function) might not cover. By including the database (via mongodb-memory-server), we verify the real queries and Mongoose models, catching issues like incorrect schema usage or query filters that return wrong data. Using Playwright as the runner provides a robust environment for these tests. It handles launching browsers for E2E scenarios and can also do API calls. We prefer Playwright here for integration tests (instead of using Jest + Supertest, for example) to stay consistent with the E2E tooling and because Playwright can easily cover both UI and API aspects. Another benefit is Playwright’s tracing and screenshot capabilities, which can help debug failures in CI by examining what the browser saw. By integrating these tests, we achieve coverage on things like:
Does the Next.js application start correctly with our configuration?
Do our API endpoints actually work end-to-end (e.g., the /api/search endpoint returns results when the DB has certain data, etc.)?
Does a full user workflow execute without errors (for example, end-to-end signup or listing creation as shown)?
These are the kinds of issues that unit tests might miss, especially in a complex environment with NextAuth, RBAC, etc. Risks & Gotchas:
Test Flakiness: End-to-end style tests can be flaky if not written carefully. To mitigate this:
Always wait for page events or network responses rather than using fixed delays. Use page.waitForSelector(...) or await expect(element).toBeVisible() to synchronize test actions with app state.
If a test involves time-dependent behavior (like an email verification that comes after 10 seconds), try to shorten or mock that in test. Long sleeps will slow tests; instead simulate or intercept where possible.
Ensure that the app in test mode sends minimal external requests. For example, disable any analytics or third-party calls via env flags. Any network call that isn’t to our app could introduce flakiness if the external service is slow or requires network.
Performance: Running a Next server + browser can be heavy. Tests will be slower than unit tests. Keep the integration test suite targeted – focus on the most important flows. It’s common to have maybe a dozen integration tests covering core scenarios. Don’t try to cover every minor edge case here (that’s what unit tests are for). This keeps runtime reasonable (e.g. a few minutes). In CI, consider running these in a separate job (so that unit tests can still give quick feedback). If using GitHub Actions, you might use the Playwright GH Action which sets up browsers. Also, set CI=true environment so Playwright runs in headless mode and possibly with fewer resources.
CI Configuration: As mentioned, ensure the CI installs Playwright dependencies (e.g., on Linux, Playwright’s npm install usually pulls browser binaries; you might need to run npx playwright install --with-deps on a fresh runner). Also, consider using the reuseExistingServer: !process.env.CI config as above – this lets you locally reuse a running dev server for speed, but always start fresh in CI.
Database State Management: If tests run in parallel, be careful that they don’t interfere via the DB. You might isolate them by using different collections or locking tests to run sequentially. A safer strategy is to run Playwright tests with a single worker (set workers: 1 in the config for the project). This will avoid concurrency issues in the database and also reduce load (since one Next server can handle the sequential tests). It will be slower than parallel, but typically integration tests count is low enough.
NextAuth/Auth flows: Testing authentication flows can be complex. If using NextAuth, you might not want Playwright to actually perform OAuth flows. Instead, you can simulate an authenticated state. For example, if using credentials/email, you did as above by filling the form. If using OAuth, consider seeding a session: you can create a session token in the test DB and set the cookie in the browser context so that the app thinks the user is logged in. Playwright allows setting cookies via context.addCookies(). You’d need to know the cookie format used by NextAuth (e.g. next-auth.session-token). This avoids external login and speeds up tests.
Sanity/External APIs in integration: As noted, ensure that pages or API routes that normally call Sanity (or any external API) are handled. Ideally, by the time you’re at integration testing, most data should come from the local DB or be stubbed. If not, you might use MSW (Mock Service Worker) with Playwright to intercept network calls to Sanity and return dummy data. Playwright can intercept network requests via page.route('https://*.sanity.io/**', route => route.fulfill({ body: JSON.stringify(fakeData) })). This is an advanced usage, but it’s a powerful way to prevent real external calls during the test.
Maintenance: As with any E2E tests, if the UI or API changes (routes, text, etc.), these tests need updating. Try to write them in a resilient way: use getByRole and visible text that’s less likely to change than selectors. But accept that some churn in tests is normal when features change. The confidence they provide is usually worth the maintenance.
By adding these Playwright integration tests, we bolster our test suite to catch issues that occur only when multiple pieces are integrated. This is especially important in a Next.js monorepo with a lot of moving parts (frontend, backend API, database, CMS). It ensures our critical user journeys and API functionalities work as expected in a production-like environment.
4. Improve Test Isolation, Configuration and Maintainability
Exact Refactoring Steps:
Centralize Test Configuration: Consolidate configuration that is common across tests to a single location. For example, use one Jest config (or a base config) for all Jest tests. Ensure all custom setup (like global mocks, extended matchers, etc.) are loaded via jest.setup.ts (already discussed). Similarly, keep Playwright config centralized (playwright.config.ts). This means:
Remove any duplicate or per-test configuration scattered in different files. For instance, if multiple test files manually configure Mongoose or set environment variables, move that to a global setup (for Jest, use setupFiles or setupFilesAfterEnv; for Playwright, use globalSetup or the webServer config as described).
Use shared helpers: Create utility functions for repetitive tasks (e.g. seeding data, logging in users in tests, rendering with providers). Place them in a tests/utils folder so all tests can import them. This avoids each test reinventing the wheel and makes maintenance easier (update in one place).
Files to Update/Create: For Jest – ensure jest.config.js exists at root (if using monorepo, possibly one per package or a root that covers all using projects). Define clear patterns for test files (like **/*.test.ts?(x)) so new tests are picked up. Include the global setup file (for DB or env) and teardown if needed (e.g. to stop any servers or close connections). For Playwright – ensure playwright.config.ts has everything needed (as above).
Consistent Use of Mocks/Stubs: Enforce that all tests use the same strategy for external services to avoid one test accidentally hitting a real service:
Set Jest to fail tests on unmocked network calls if possible. One way is to use jest.spyOn(global, 'fetch') in setup to throw if called, unless tests explicitly mock fetch. This helps catch any test that might try to call external APIs. Alternatively, use the --detectOpenHandles and --forceExit flags (as seen in memory-server guides
dev.to
) to ensure no hanging connections.
Add module name mappers in Jest config to map modules to their mocks. For example, ensure that if code imports a module like @sanity/client, it’s mapped to our mock implementation module by default. In jest.config.js:
moduleNameMapper: {
  '^@sanity/client$': '<rootDir>/tests/__mocks__/sanityClient.js',
  '^ioredis$': 'ioredis-mock',  // ensure ioredis import uses the mock
  // ...other mappings if needed
},
restoreMocks: true,
clearMocks: true,
resetModules: true,
The restoreMocks/clearMocks options make sure that any jest.spyOn or mock state is reset between tests automatically, improving isolation.
Document in a contributing or testing readme that any new external integration should be mocked in tests following these patterns.
Eliminate Test Flakiness: Go through the test suite and fix any nondeterministic behavior:
If some tests rely on timers (like debouncing or async waits), use Jest’s fake timers or explicit waits to control timing. For example, for a debounce hook test, you can jest.useFakeTimers() and advance time to simulate the delay.
Ensure each test has a clean state. For unit tests with in-memory DB, call disconnectInMemoryDB() and reconnect between suites or use fresh MongoMemoryServer instances as needed. For integration, as discussed, clear DB state between tests.
If tests shared some singleton state (e.g. a singleton Mongoose connection or a cached value), use jest.resetModules() (enabled by config as above) to isolate module instances per test file. This prevents cross-test pollution where one test could, for instance, modify a global variable that another test reads.
Randomize test order (optional): Jest has --shuffle (or use a third-party) to run tests in random order on CI occasionally – this can help detect hidden dependencies between tests. If discovered, refactor tests to remove those couplings.
Run tests in CI with sufficient retries if a particular test is flaky due to external conditions. Playwright supports a retries option in config for CI runs (e.g. retries: 1 to retry once if fail). This should not be a crutch – fix root causes of flakiness – but a mild retry can handle rare timing issues.
Maintainability Enhancements:
Simplify Test Data Management: If many tests use similar data setup, consider creating factory functions or JSON fixtures. For example, a makeListing(overrides) function to generate listing objects with default fields can reduce repetition and make tests clearer. Store these in a tests/factories/ module.
Test Naming and Organization: Make sure test files and test cases have descriptive names. This helps when reading test outputs. Organize tests in folders (unit tests in one folder, integration in another) or use naming conventions so it’s clear which are which (some projects suffix integration tests differently or put them under e2e/). This clarity helps new contributors run or focus on relevant tests.
Continuous Integration Settings: Update CI config (e.g., GitHub Actions workflows) to run the tests with the new structure. Possibly split jobs: run unit tests (Jest) and integration tests (Playwright) separately. This can improve feedback time and allow using different machine needs (Playwright might need a bigger container or Xvfb for browsers). Also, add caching for dependencies and the MongoDB binary as mentioned.
Remove Flaky Tests or Quarantining: If after all fixes, a test is still flaky and not essential, consider temporarily quarantining it (skip in CI) with a test.skip and an associated TODO to fix. This prevents random CI failures blocking merges. But aim to have zero skipped tests long-term.
Regularly Review and Update: Mark this step as ongoing: as the project evolves, periodically revisit the test configs and mocks. For instance, if Next.js introduces a new testing utility or if any of the libraries deprecate something (like mongodb-memory-server v8 might change API), update accordingly. Keeping the testing tools up-to-date is part of maintainability.
Explanation of Changes: This final set of changes is about polishing the testing system to be robust and easy to work with. By centralizing configuration, we reduce duplication and the chance of inconsistency. For example, if all tests go through one config, you won’t have one suite using a different timeout or a different mock setup than another – everything uses the same base, so behavior is uniform. This also makes updates easier: if we decide to change a library (say, swap out mongodb-memory-server for another solution), we change it in one place. Test isolation improvements ensure that tests don’t impact each other. This is crucial when tests run in random order or in parallel. Each test should be able to run independently of others and on any machine with the same results. Achieving this often means cleaning up side effects (e.g., no leftover DB entries, no global variables modified, no unmocked network calls that might pass or fail depending on network). We’ve put measures in place for each of these – clearing databases, using restoreMocks, and so on. By using stable libraries and proven patterns (no experimental Node APIs or unstable Next features for testing), we prioritize long-term maintainability. For instance, using Playwright (a well-supported project) and Jest (widely used) means we get community support and updates. We avoid hacks like manually tweaking Next internals or using unofficial plugins, which might break on upgrade. This conservative approach in testing is beneficial since tests are our safety net – we want them to be rock solid. Risks & Gotchas:
Initial Setup Effort: There is upfront work to reorganize tests and configs, which might temporarily cause some test failures if something is missed. It’s important to run tests frequently while refactoring to catch issues (e.g., if a global mock wasn’t applied and a test suddenly starts calling real API).
Learning Curve: Team members need to get acquainted with the new testing approach. Provide documentation – for example, update docs/DEVELOPMENT_GUIDE.md or create a docs/TESTING_GUIDE.md explaining how to run tests, how to write new tests with mocks, and examples of the patterns. This will help maintain consistency as new tests are written.
CI Timing: Integration tests will lengthen the CI run. Monitor if this is acceptable (perhaps the total build+test time is still okay). If not, consider running some tests nightly or reviewing if any tests can be slimmed down. However, given the scope, it should be manageable.
Environment Parity: Because we use NODE_ENV=test configuration, ensure that this doesn’t accidentally bypass important logic. For example, if in code there’s if (process.env.NODE_ENV !== 'production') { /* skip auth */ }, tests might pass but production would enforce auth. We should strive to keep behavior in test as close to real as possible, only stubbing external dependencies. So be cautious with any test-specific branches in code – use them only for truly external interactions, not core logic.
Dependency Version Locking: To avoid surprises, lock versions of test libs in package.json (or use a lockfile). A sudden major update to something like Testing Library or Playwright could change behaviors. Regularly update these intentionally and adjust tests if needed.
Mocks Consistency: If multiple mocks are nested, be careful about their order. For instance, if a Sanity client is used inside a function that’s mocked, ensure the client itself is mocked at the right level. In general, prefer higher-level mocks (mock the module providing data rather than deep internals). This reduces how many places need updating when something changes.
By implementing all the above, the test suite will be faster, more reliable, and easier to work with. Developers can run unit tests quickly for rapid feedback, and the CI can run the full suite (unit + component + integration) to catch any regressions. Tests will be less flaky, so a red build truly means something is wrong with the code, not the tests. Overall, these refactors will support the long-term health of the project by ensuring new features and changes can be verified with confidence. Each improvement – from mocking external services to comprehensive UI tests to end-to-end verifications – adds layers to a balanced testing strategy that will accompany the project as it grows.
Citations

Testing with MongoDB-Memory-Server - DEV Community

https://dev.to/remrkabledev/testing-with-mongodb-memory-server-4ja2

GitHub - stipsan/ioredis-mock: Emulates ioredis by performing all operations in-memory.

https://github.com/stipsan/ioredis-mock

GitHub - stipsan/ioredis-mock: Emulates ioredis by performing all operations in-memory.

https://github.com/stipsan/ioredis-mock

Testing with MongoDB-Memory-Server - DEV Community

https://dev.to/remrkabledev/testing-with-mongodb-memory-server-4ja2

Testing with MongoDB-Memory-Server - DEV Community

https://dev.to/remrkabledev/testing-with-mongodb-memory-server-4ja2

React Testing Essentials: A Practical Guide to Jest and Vitest with RTL | by Yogesh Datir | JavaScript in Plain English

https://javascript.plainenglish.io/react-testing-essentials-a-practical-guide-to-jest-and-vitest-with-rtl-fd2221dc7b76?gi=69254bad93a6

React Testing Essentials: A Practical Guide to Jest and Vitest with RTL | by Yogesh Datir | JavaScript in Plain English

https://javascript.plainenglish.io/react-testing-essentials-a-practical-guide-to-jest-and-vitest-with-rtl-fd2221dc7b76?gi=69254bad93a6

React Testing Essentials: A Practical Guide to Jest and Vitest with RTL | by Yogesh Datir | JavaScript in Plain English

https://javascript.plainenglish.io/react-testing-essentials-a-practical-guide-to-jest-and-vitest-with-rtl-fd2221dc7b76?gi=69254bad93a6
GitHub
README.md

https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory/blob/db490723f004b909e6134b6860b644b8c2be8e4a/README.md#L27-L30
GitHub
README.md

https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory/blob/db490723f004b909e6134b6860b644b8c2be8e4a/README.md#L35-L38