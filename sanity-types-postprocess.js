#!/usr/bin/env node
/**
 * Sanity TypeGen post-processing script
 * - Inserts a SanityReference helper type
 * - Replaces inline image asset references with union: SanityReference | SanityImageAsset
 * - Removes previously injected duplicate custom blocks (if present)
 *
 * Targets both:
 *  - app-next-directory/sanity.types.ts
 *  - sanity/sanity.types.ts
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = __dirname;
const targets = [
  path.join(repoRoot, 'app-next-directory', 'sanity.types.ts'),
  path.join(repoRoot, 'sanity', 'sanity.types.ts'),
];

function run() {
  const changedFiles = [];
  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    const original = content;

    // 1) Remove any previous custom block we may have injected earlier
    //    We detect blocks that start with `// Custom additions` and end right before `// Source: schema.json`
    content = content.replace(
      /\/\/ Custom additions:[\s\S]*?(?=\n\/?\/\/ Source: schema\.json)/m,
      ''
    );

    // 2) Ensure a minimal SanityReference helper exists near the top, before `// Source: schema.json`
    const refBlock = `/* Postprocess additions: reference union */\nexport type SanityReference = { _ref: string; _type: 'reference'; _weak?: boolean }\n\n`;
    if (!content.includes('Postprocess additions: reference union')) {
      content = content.replace(/(\/\*\*\n \* -{5,}[\s\S]*?\* -{5,}\n \*\/\n\n)/m, `$1${refBlock}`);
    }

    // 3) Replace inline asset reference objects with SanityReference | SanityImageAsset
    //    Pattern tries to be tolerant to spacing/newlines and additional fields.
    const assetInlineRefRegex =
      /asset\?:\s*\{[\s\S]*?\[internalGroqTypeReferenceTo\]\?:\s*'sanity\.imageAsset'[\s\S]*?\}/g;
    content = content.replace(assetInlineRefRegex, 'asset?: SanityReference | SanityImageAsset');

    // 4) In rich text images and other image objects that might not include [internalGroqTypeReferenceTo]
    //    some generators emit asset?: { _ref: string; _type: 'reference' } without the symbol. Handle those too.
    const simpleRefRegex = /asset\?:\s*\{\s*_ref:\s*string\s*,\s*_type:\s*'reference'[\s\S]*?\}/g;
    content = content.replace(simpleRefRegex, match => {
      // If the inline object already contains 'sanity.imageAsset' marker, it was handled above.
      if (/sanity\.imageAsset/.test(match)) return match;
      return 'asset?: SanityReference | SanityImageAsset';
    });

    // 5) Deduplicate potential duplicate SanityImageAsset declarations introduced by earlier manual edits
    //    If we find an early "export interface SanityImageAsset { ... }" before the official generator's
    //    "export type SanityImageAsset = { ... }", remove the interface block.
    const hasTypeDecl = /export\s+type\s+SanityImageAsset\s*=\s*\{/.test(content);
    if (hasTypeDecl) {
      content = content.replace(/export\s+interface\s+SanityImageAsset\s*\{[\s\S]*?\}\s*/m, '');
    }

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles.push(path.relative(repoRoot, file));
    }
  }
}

run();
