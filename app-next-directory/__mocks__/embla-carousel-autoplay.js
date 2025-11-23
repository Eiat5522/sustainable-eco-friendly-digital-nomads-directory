// Mock for embla-carousel-autoplay
const Autoplay = options => {
  return {
    init: () => {},
    destroy: () => {},
    stop: () => {},
    play: () => {},
    ...options,
  };
};

module.exports = {
  __esModule: true,
  default: Autoplay,
};
