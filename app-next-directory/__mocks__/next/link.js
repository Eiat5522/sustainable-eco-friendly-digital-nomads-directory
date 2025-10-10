// Mock for next/link
const React = require('react');

function Link({ children, href, passHref, legacyBehavior, ...props }) {
  return React.createElement('a', { href, ...props }, children);
}

module.exports = Link;
module.exports.default = Link;
