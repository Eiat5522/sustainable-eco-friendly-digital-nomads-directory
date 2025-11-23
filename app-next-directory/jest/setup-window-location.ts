const mockLocation = {
  assign: jest.fn(),
  reload: jest.fn(),
  href: 'http://mocked.com/initial',
};

let originalLocationDescriptor: PropertyDescriptor | undefined;

beforeAll(() => {
  originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');

  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    get: () => mockLocation,
    set: value => {
      Object.assign(mockLocation, value);
    },
  });
});

beforeEach(() => {
  mockLocation.assign.mockClear();
  mockLocation.reload.mockClear();
  mockLocation.href = 'http://mocked.com/initial'; // Reset href for each test
});

afterAll(() => {
  if (originalLocationDescriptor) {
    Object.defineProperty(window, 'location', originalLocationDescriptor);
  } else {
    // If there was no original descriptor, delete the property
    const windowWithMutableLocation = window as typeof window & { location?: unknown };
    delete windowWithMutableLocation.location;
  }
});
