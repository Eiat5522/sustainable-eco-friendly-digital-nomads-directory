export function urlFor(source: any) {
  // Gracefully handle null or undefined sources
  if (
    !source ||
    typeof source !== 'object' ||
    !('asset' in source) ||
    !(source as { asset?: { _ref?: string } }).asset?._ref
  ) {
    return undefined;
  }
  const { builder } = require('./client');
  return builder.image(source);
}
