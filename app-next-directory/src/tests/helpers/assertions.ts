// Assertion helpers for middleware tests

export function expectRedirectCalledWith(mockRedirect: jest.Mock, url: string | RegExp) {
  // Get the actual redirect URL argument
  const calls = mockRedirect.mock.calls;
  if (calls.length === 0) {
    throw new Error('mockRedirect was not called');
  }
  const actualUrl = calls[0][0];

  // If the expected url is a string and looks like an absolute URL, compare directly
  if (typeof url === 'string' && /^https?:\/\//.test(url)) {
    expect(actualUrl).toEqual(url);
    return;
  }

  // Otherwise, parse the actual URL and compare only the path+query
  let actualPathAndQuery = actualUrl;
  try {
    const parsed = new URL(actualUrl);
    actualPathAndQuery = parsed.pathname + parsed.search;
  } catch {
    // If not a valid URL, fallback to original string
  }

  if (typeof url === 'string') {
    expect(actualPathAndQuery).toEqual(url);
  } else {
    expect(actualPathAndQuery).toMatch(url);
  }
}

export function expectNextCalled(mockNext: jest.Mock) {
  expect(mockNext).toHaveBeenCalled();
}

export function expectJsonCalled(mockJson: jest.Mock) {
  expect(mockJson).toHaveBeenCalled();
}

export function expectHeaderSet(mockHeaderSet: jest.Mock, key: string, value: string) {
  expect(mockHeaderSet).toHaveBeenCalledWith(key, value);
}