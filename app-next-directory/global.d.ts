/// <reference types="node" />

declare namespace NodeJS {
  interface Global {
    fetch?: typeof fetch;
    __TEST_DATA__?: import('@/tests/helpers/test-data').TestData;
    __MONGODB_MEMORY__?: boolean;
    gc?: () => void;
  }
  
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare const __TEST_DATA__: import('@/tests/helpers/test-data').TestData | undefined;
declare const __MONGODB_MEMORY__: boolean | undefined;

// Node.js garbage collection function (available with --expose-gc flag)
declare var gc: (() => void) | undefined;

// Ensure global and process are available
declare var global: typeof globalThis;
declare var process: NodeJS.Process & { env: NodeJS.ProcessEnv };
