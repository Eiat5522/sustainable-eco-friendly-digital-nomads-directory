// Shim to satisfy tools that expect a JS/CJS Tailwind config
const fs = require('fs');
const path = require('path');

const here = __dirname;
const candidates = ['tailwind.config.cjs', 'tailwind.config.js'];
let resolved;

for (const name of candidates) {
  const full = path.join(here, name);
  if (fs.existsSync(full)) {
    resolved = full;
    break;
  }
}

if (resolved) {
  try {
    module.exports = require(resolved);
  } catch (err) {
    // If the config exists but can't be required, don't mask the error.
    if (err && err.code === 'ERR_REQUIRE_ESM') {
      throw new Error(
        `Found ESM Tailwind config at ${resolved}. Tools requiring a CJS config cannot load it. ` +
        `Consider adding a tailwind.config.cjs that re-exports your config or providing a CJS variant.`
      );
    }
    throw err;
  }
} else {
  // Export a minimal default to avoid tool failures when no JS/CJS config is present.
  console.warn('[tailwind] No JS/CJS Tailwind config found next to this shim; exporting a minimal default.');
  module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {},
    plugins: [],
  };
}
}
