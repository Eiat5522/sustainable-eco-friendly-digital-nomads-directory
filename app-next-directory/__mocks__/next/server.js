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

exports.createMocks = ({ method, json }) => {
  const req = {
    method,
    json: async () => json,
  };
  const res = {};
  return { req, res };
};