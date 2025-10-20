The Definitive Troubleshooting Manual for Jest and ES Modules

The transition of the JavaScript ecosystem to ECMAScript Modules (ESM) has introduced significant improvements in code organization and reusability. However, this shift has created a common point of friction for testing frameworks like Jest, which was historically designed around the CommonJS (CJS) module system. Encountering the dreaded SyntaxError: Cannot use import statement outside a module can be a frustrating roadblock for developers. This guide serves as a definitive diagnostic resource to demystify this and other related errors, providing clear, actionable configuration solutions based on official documentation and community-tested patterns.


--------------------------------------------------------------------------------


1. The Core Problem: Why Jest Struggles with import Statements

1.1. Strategic Context

Understanding the fundamental conflict between JavaScript's two module systems is the first step toward a stable testing environment. The common "SyntaxError: Cannot use import statement outside a module" is not a bug in your code, but rather a symptom of a configuration mismatch. It signals that Jest, in its default CommonJS-based execution environment, has encountered modern ESM import syntax without being properly configured to understand it. This section diagnoses the underlying causes of this conflict.

1.2. Diagnosing the "SyntaxError"

This error arises when Jest's runtime environment is not aligned with the module syntax used in your source or dependency files.

Root Causes

* ES Modules vs. CommonJS: JavaScript has two primary module systems: the modern ESM standard, which uses import and export statements, and the legacy CommonJS standard (used by Node.js for years), which uses require() and module.exports. Jest was built for and defaults to a CommonJS environment, so it does not recognize ESM syntax out of the box.
* Missing Project Configuration: Jest throws this error when it encounters import syntax without being explicitly configured to handle ESM. This typically means the necessary settings, such as "type": "module", are missing from your package.json file or that your jest.config.js is not set up for ESM.
* Untranspiled node_modules: By default, Jest does not apply code transformations to files inside the node_modules directory for performance reasons. This becomes a problem when a dependency you've installed is published as an ESM package. When Jest tries to run it, it encounters the import syntax and fails.
* Incorrect File Extensions: Both Node.js and Jest rely on file extensions (e.g., .mjs for ESM, .cjs for CJS) or the "type": "module" field in package.json to determine how to treat a .js file. A mismatch between the file's content and the project's module configuration will lead to this syntax error.

Successfully diagnosing the issue allows us to proceed with one of two primary solution pathways: enabling Jest's native ESM support or using a transpiler like Babel.


--------------------------------------------------------------------------------


2. Solution Pathway 1: Enabling Jest's Native ESM Support (Recommended)

2.1. Strategic Context

The most modern and forward-looking solution is to configure Jest to use its native support for ES Modules. This approach aligns with the direction of the Node.js ecosystem and avoids adding extra build steps to your testing process. However, it is important to note that this functionality relies on experimental features in both Jest and Node.js. As stated in the official Jest documentation, this implementation is experimental and may have bugs or missing features.

2.2. Step-by-Step Configuration

Follow these steps to enable native ESM support in a JavaScript project.

1. Set "type": "module" in package.json
2. This line instructs Node.js to treat all .js files within your project as ES Modules by default.
3. Execute Node with --experimental-vm-modules
4. Jest's ESM support depends on an experimental feature within Node.js that must be explicitly enabled via a command-line flag. You can add this flag to the test script in your package.json.
5. Disable Code Transformations in jest.config.js
6. To use native ESM, you must prevent Jest from trying to transpile your code. This is done by setting the transform property to an empty object in your Jest configuration.

2.3. TypeScript-Specific Configuration (ts-jest)

For TypeScript projects, additional configuration is required to ensure ts-jest transpiles your code into ESM-compatible JavaScript.

2.3.1. Configure tsconfig.json

Your TypeScript compiler options must be set to emit modules in a format that Node.js understands as ESM. You have two primary options.

* Option 1: Using ES Module Values
* Set the module option to a modern ES version. The ts-jest documentation recommends using ES2022 or ESNext for full feature support.
* Option 2: Using Hybrid Module Values
* Alternatively, you can use Node16 or NodeNext. According to the ts-jest documentation, this option must be paired with "isolatedModules": true.

2.3.2. Configure jest.config.ts

Your Jest configuration needs to be updated to instruct ts-jest to handle .ts files as ES Modules and to correctly map module imports.

// jest.config.ts
export default {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};


With these steps, your project should be fully configured for native ESM testing. However, for projects that cannot use experimental features, transpilation remains a viable alternative.


--------------------------------------------------------------------------------


3. Solution Pathway 2: Using Transpilation with Babel

3.1. Strategic Context

Transpilation is the traditional and most stable solution for resolving Jest's incompatibility with ESM. This method uses Babel to convert modern ESM syntax (import/export) back into CommonJS (require/module.exports) before the tests are run. This makes it a robust and reliable choice for projects with complex build chains or for teams that prefer to avoid experimental Node.js and Jest features.

3.2. Step-by-Step Configuration

Setting up Jest with Babel requires installing a few dependencies and creating configuration files.

1. Install Dependencies
2. Install babel-jest and the necessary Babel packages as development dependencies.
3. Create babel.config.js
4. Create a babel.config.js file in your project's root directory. This file tells Babel which presets to use for transpiling your code. @babel/preset-env is a smart preset that allows you to use the latest JavaScript features.
5. Update jest.config.js
6. Finally, configure Jest to use babel-jest to transform your JavaScript files.

Once module resolution is fixed, either through native support or transpilation, the next major hurdle is correctly mocking modules in an ESM environment.


--------------------------------------------------------------------------------


4. Advanced Troubleshooting: Mocking in an ESM Environment

4.1. Strategic Context

Mocking modules in an ESM context is a critical challenge. The standard jest.mock() function relies on a mechanism called "hoisting," which moves mock declarations to the top of the file before execution. This mechanism fails with ESM because import statements are static and are evaluated by the JavaScript engine before any of your test code—including jest.mock()—is executed. This section details the modern, albeit unstable, API designed specifically to solve this problem.

4.2. The jest.unstable_mockModule Pattern

4.2.1. Why jest.mock() Fails

In an ESM environment, the module graph is resolved and static import statements are processed before the test code runs. This means the module you intend to mock has already been loaded into memory before Jest has a chance to intercept it with a standard jest.mock() call.

4.2.2. The Correct Implementation

The correct pattern for mocking in ESM involves a two-step process that works around the static nature of imports.

1. Call jest.unstable_mockModule: This function must be called before the module you want to mock is imported. It takes the module path and a factory function (which can be async) that returns the mocked implementation.
2. Use Dynamic await import(): After the mock has been registered with jest.unstable_mockModule, the module (and any other modules that depend on it) must be loaded using a dynamic import(). This ensures the code execution waits for the mock to be in place before loading the module.

4.2.3. Code Example: Mocking a Module

This example demonstrates the complete pattern for mocking a module and then using it in a test, following best practices for test setup and isolation.

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

// Define the mock implementation outside the test suite
const mockedGet = jest.fn().mockResolvedValue("Mocked");

// 1. Register the mock BEFORE any imports in the test file
jest.unstable_mockModule("./myClass.js", () => ({
  MyClass: jest.fn().mockImplementation(() => ({
    get: mockedGet,
  })),
}));

// We need to dynamically import the class *after* the mock is registered.
// This is best done in a beforeAll block to ensure it's available for all tests.
let MyClass;
let myInstance;

describe("MyClass", () => {
  beforeAll(async () => {
    // 2. Dynamically import the module to get the mocked version
    const module = await import("./myClass.js");
    MyClass = module.MyClass;
  });

  beforeEach(() => {
    // Clear mock history and create a fresh instance before each test
    mockedGet.mockClear();
    myInstance = new MyClass();
  });

  it("should use the mocked implementation", async () => {
    const result = await myInstance.get();
    expect(result).toEqual("Mocked");
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });
});


4.3. Unmocking Modules

To restore the original implementation of a module after it has been mocked, use jest.unstable_unmockModule. This is useful for tests that need to switch between mocked and real implementations.

The following example shows how to mock a module, run a test, unmock it, and then run another test with the original module.

import { jest, test, expect } from '@jest/globals';

test('test esm-module mock and unmock', async () => {
  // Step 1: Mock the module's implementation for the first test scenario.
  jest.unstable_mockModule('./esm-module.js', () => ({
    default: () => 'default implementation',
    namedFn: () => 'namedFn implementation',
  }));

  // Step 2: Dynamically import the module to get the mocked version.
  const mockModule = await import('./esm-module.js');
  expect(mockModule.default()).toBe('default implementation');
  expect(mockModule.namedFn()).toBe('namedFn implementation');

  // Step 3: Unmock the module to restore its original implementation.
  jest.unstable_unmockModule('./esm-module.js');
  
  // Step 4: Dynamically import the module AGAIN to get the original version.
  const originalModule = await import('./esm-module.js');
  expect(originalModule.default()).toBe('default');
  expect(originalModule.namedFn()).toBe('namedFn');
});


Beyond configuration and mocking, a few other common pitfalls can disrupt a smooth testing experience.


--------------------------------------------------------------------------------


5. Common Pitfalls and Best Practices

5.1. Strategic Context

Beyond the primary challenges of ESM configuration and mocking, several other common issues can arise. These often relate to global variables, untranspiled dependencies, and import syntax conventions. This section serves as a checklist of essential practices and quick fixes to help you maintain a clean and efficient testing workflow.

5.2. Essential Fixes and Practices

Importing the jest Global

In ESM files, the jest object is no longer an automatically available global variable. You must explicitly import it in each test file where it is used.

// Option 1: Named import from @jest/globals
import { jest } from '@jest/globals';
jest.useFakeTimers();

// Option 2: Using the import.meta property
import.meta.jest.useFakeTimers();


Handling Untranspiled Dependencies in node_modules

If a package in node_modules is published as ESM, Jest will fail with a SyntaxError because it doesn't transform dependencies by default. You must explicitly tell Jest to transform that specific module by updating transformIgnorePatterns in your Jest config. The key is to use a negative lookahead regular expression (?!) to exclude your target library from the ignore list.

// jest.config.js
module.exports = {
  transformIgnorePatterns: [
    "/node_modules/(?!(your-library-name|react-markdown)/)",
  ],
};


Using Correct File Extensions and Imports

Adhering to ESM conventions for file paths and import statements is crucial for avoiding module resolution errors.

* Use .js extensions in import paths: When importing local files in an ESM project, you must include the file extension. As noted in community guides, "you need to do is change your imports to reference the js built files: import { export } from './source.file.js'". This is necessary for Node.js to correctly resolve the module.
* Keep Imports at the Top: For better organization and readability, all import statements should be placed at the top of your test files.
* Avoid Mixing Module Systems: Do not mix import (ESM) and require (CJS) within the same file. Use one module system consistently to prevent confusion and potential errors.


--------------------------------------------------------------------------------


6. Conclusion: Key Takeaways

While integrating Jest with ES Modules presents a series of configuration hurdles, they are entirely solvable with the right approach. The core challenge stems from Jest's historical foundation in CommonJS, which requires deliberate action to align with the modern ESM standard. The path forward requires a clear choice: either commit to enabling Jest's native ESM support through Node flags and specific configurations, aligning your project with the future of the ecosystem, or implement a stable and battle-tested transpilation pipeline with Babel for maximum compatibility. Finally, mastering modern testing patterns with jest.unstable_mockModule is the key to unlocking the ability to test complex application logic in a modern ESM codebase, ensuring your tests remain robust, reliable, and effective.
