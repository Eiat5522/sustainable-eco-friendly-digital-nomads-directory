const React = require('react');

const NextImageMock = React.forwardRef(function NextImageMock(
  {
    src = '',
    alt = '',
    fill: _fill,
    priority: _priority,
    loader: _loader,
    quality: _quality,
    style,
    ...rest
  },
  ref
) {
  const combinedStyle = style ? { ...style } : undefined;
  return React.createElement('img', {
    ...rest,
    ref,
    src,
    alt,
    style: combinedStyle,
  });
});

module.exports = NextImageMock;
module.exports.default = NextImageMock;
module.exports.__esModule = true;
