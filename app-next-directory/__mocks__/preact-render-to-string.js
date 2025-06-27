// A minimal mock for preact-render-to-string
module.exports = {
  render: jest.fn(() => 'mock-rendered-string'),
  renderToString: jest.fn(() => 'mock-rendered-string'),
  shallowRender: jest.fn(() => 'mock-rendered-string'),
  renderToStaticMarkup: jest.fn(() => 'mock-rendered-string'),
};
