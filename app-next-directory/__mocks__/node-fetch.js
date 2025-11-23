module.exports = {
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      status: 200,
      ok: true,
    })
  ),
  Response: jest.fn(() => {}),
  Headers: jest.fn(() => {}),
};
