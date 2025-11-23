declare namespace NodeJS {
  interface Global {
    fetch?: typeof fetch;
    __TEST_DATA__?: import('@/tests/helpers/test-data').TestData;
    __MONGODB_MEMORY__?: boolean;
  }
}

declare const __TEST_DATA__: import('@/tests/helpers/test-data').TestData | undefined;
declare const __MONGODB_MEMORY__: boolean | undefined;
