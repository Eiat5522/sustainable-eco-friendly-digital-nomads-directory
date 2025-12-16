// Mock for embla-carousel-react
const mockEmblaApi = {
  canScrollPrev: () => true,
  canScrollNext: () => true,
  scrollPrev: () => {},
  scrollNext: () => {},
  on: () => {},
  off: () => {},
  reInit: () => {},
};

const useEmblaCarousel = (_options, _plugins) => {
  // Return a ref function and the mock API
  const ref = () => {};
  return [ref, mockEmblaApi];
};

module.exports = {
  __esModule: true,
  default: useEmblaCarousel,
};
