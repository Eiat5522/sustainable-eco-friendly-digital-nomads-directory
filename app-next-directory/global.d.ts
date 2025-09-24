declare namespace NodeJS {
  interface Global {
    fetch?: typeof fetch;
    __TEST_DATA__?: import('@/tests/helpers/test-data').TestData;
  }
}

declare const __TEST_DATA__: import('@/tests/helpers/test-data').TestData | undefined;

