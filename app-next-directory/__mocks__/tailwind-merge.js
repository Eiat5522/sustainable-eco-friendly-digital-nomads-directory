// Mock for tailwind-merge
function twMerge(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

module.exports = {
  twMerge,
  default: { twMerge }
};