// Manual Jest mock for next/server to ensure all imports use the mock

exports.NextResponse = {
  json: jest.fn((data, init) => {
    return {
      _mockData: data,
      _mockInit: init,
      json: () => Promise.resolve(data),
      status: (init && init.status) || 200,
      body: data,
    };
  }),
};