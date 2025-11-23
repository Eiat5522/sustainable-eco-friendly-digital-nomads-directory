// Mock for tailwind-merge
function twMerge(...classNames) {
  // Join classes and do basic deduplication to simulate twMerge behavior
  // This prevents the fallback deduplication logic in utils.ts from being triggered
  const joined = classNames.filter(Boolean).join(' ');
  const classes = joined.split(/\s+/).filter(Boolean);

  // Simple deduplication by keeping last occurrence of each class
  // This simulates the basic behavior of tailwind-merge
  const seen = new Set();
  const result = [];
  for (let i = classes.length - 1; i >= 0; i--) {
    if (!seen.has(classes[i])) {
      seen.add(classes[i]);
      result.unshift(classes[i]);
    }
  }

  return result.join(' ');
}

module.exports = {
  twMerge,
  default: { twMerge },
};
