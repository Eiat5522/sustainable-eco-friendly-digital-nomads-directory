// Mock for '@vercel/analytics/react' package
const React = require('react');

const Analytics = jest.fn(() => null);

module.exports = {
  Analytics,
};
