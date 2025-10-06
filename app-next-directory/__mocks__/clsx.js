// Mock for clsx
module.exports = function clsx(...inputs) {
  return inputs
    .filter(Boolean)
    .map(input => {
      if (typeof input === 'string') return input;
      if (Array.isArray(input)) return input.filter(Boolean).join(' ');
      if (typeof input === 'object') {
        return Object.keys(input)
          .filter(key => input[key])
          .join(' ');
      }
      return '';
    })
    .join(' ');
};

module.exports.clsx = module.exports;
module.exports.default = module.exports;